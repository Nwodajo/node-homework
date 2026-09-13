require("dotenv").config();
process.env.DATABASE_URL = process.env.TEST_DATABASE_URL;

const prisma = require("../db/prisma");
const httpMocks = require("node-mocks-http");
const EventEmitter = require("events");

const {
  index,
  show,
  create,
  update,
  deleteTask,
  bulkDeleteTasks,
} = require("../controllers/taskController");

const waitForRouteHandlerCompletion = require("./waitForRouteHandlerCompletion");

let user1 = null;
let user2 = null;
let saveRes = null;
let saveData = null;
let saveTaskId = null;

let bulkTask1 = null;
let bulkTask2 = null;
let bulkTask3 = null;
let user2Task = null;

beforeAll(async () => {
  await prisma.Task.deleteMany();
  await prisma.User.deleteMany();

  user1 = await prisma.User.create({
    data: {
      name: "Bob",
      email: "bob@sample.com",
      hashedPassword: "nonsense",
    },
  });

  user2 = await prisma.User.create({
    data: {
      name: "Alice",
      email: "alice@sample.com",
      hashedPassword: "nonsense",
    },
  });
});

afterAll(async () => {
  await prisma.$disconnect();
});

describe("testing task creation", () => {
  it("14. cant create a task without a user id", async () => {
    expect.assertions(1);

    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    try {
      await waitForRouteHandlerCompletion(create, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("15. cant create a task with a bogus user id", async () => {
    expect.assertions(1);

    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    req.user = { id: 999999 };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    try {
      await waitForRouteHandlerCompletion(create, req, res);
    } catch (e) {
      expect(e.name).toBe("PrismaClientKnownRequestError");
    }
  });

  it("16. create succeeds with a valid user id", async () => {
    const req = httpMocks.createRequest({
      method: "POST",
      body: { title: "first task" },
    });

    req.user = { id: user1.id };

    saveRes = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(create, req, saveRes);

    expect(saveRes.statusCode).toBe(201);
  });

  it("17. created task has expected title", () => {
    saveData = saveRes._getJSONData();

    expect(saveData.title).toBe("first task");
  });

  it("18. created task has correct isCompleted value", () => {
    expect(saveData.isCompleted).toBe(false);
  });

  it("19. created task does not return userId", () => {
    saveTaskId = saveData.id;

    expect(saveData.userId).toBeUndefined();
  });
});

describe("test getting created tasks", () => {
  it("20. cant get a list of tasks without a user id", async () => {
    expect.assertions(1);

    const req = httpMocks.createRequest({
      method: "GET",
    });

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    try {
      await waitForRouteHandlerCompletion(index, req, res);
    } catch (e) {
      expect(e.name).toBe("TypeError");
    }
  });

  it("21. If you use user1's id on index() the call returns a 200 status.", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user1.id };

    saveRes = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, saveRes);

    expect(saveRes.statusCode).toBe(200);
  });

  it("22. The returned object has a tasks array of length 1.", () => {
    saveData = saveRes._getJSONData();

    expect(saveData.tasks.length).toBe(1);
  });

  it("23. The title in the first array object is as expected.", () => {
    expect(saveData.tasks[0].title).toBe("first task");
  });

  it("24. The first array object does not contain a userId.", () => {
    expect(saveData.tasks[0].userId).toBeUndefined();
  });

  it("25. user2 gets a 404 when retrieving user1 tasks", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user2.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("26. user1 can retrieve the created task using show()", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(show, req, res);

    expect(res.statusCode).toBe(200);
  });

  it("27. user2 cannot retrieve user1's task", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = { id: user2.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(show, req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("testing update and delete of tasks", () => {
  it("28. user1 can update the task to completed", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      params: {
        id: saveTaskId.toString(),
      },
      body: {
        isCompleted: true,
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(update, req, res);

    expect(res.statusCode).toBe(200);
  });

  it("29. user2 cannot update user1's task", async () => {
    const req = httpMocks.createRequest({
      method: "PATCH",
      params: {
        id: saveTaskId.toString(),
      },
      body: {
        isCompleted: false,
      },
    });

    req.user = { id: user2.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(update, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("30. user2 cannot delete user1's task", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = { id: user2.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(deleteTask, req, res);

    expect(res.statusCode).toBe(404);
  });

  it("31. user1 can delete the task", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      params: {
        id: saveTaskId.toString(),
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(deleteTask, req, res);

    expect(res.statusCode).toBe(200);
  });

  it("32. retrieving user1 tasks now returns 404", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    expect(res.statusCode).toBe(404);
  });
});

describe("testing Assignment 11 search, pagination, and sorting", () => {
  beforeAll(async () => {
    bulkTask1 = await prisma.Task.create({
      data: {
        title: "Apple task",
        userId: user1.id,
      },
    });

    bulkTask2 = await prisma.Task.create({
      data: {
        title: "Banana task",
        userId: user1.id,
      },
    });

    bulkTask3 = await prisma.Task.create({
      data: {
        title: "Apple meeting",
        userId: user1.id,
      },
    });

    user2Task = await prisma.Task.create({
      data: {
        title: "Alice private task",
        userId: user2.id,
      },
    });
  });

  it("33. search returns only matching tasks for the logged-in user", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        find: "Apple",
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.tasks.length).toBe(2);

    expect(
      data.tasks.every((task) =>
        task.title.toLowerCase().includes("apple"),
      ),
    ).toBe(true);
  });

  it("34. pagination returns the requested number of tasks", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        page: "1",
        limit: "2",
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.tasks.length).toBe(2);
    expect(data.pagination.page).toBe(1);
    expect(data.pagination.limit).toBe(2);
    expect(data.pagination.total).toBe(3);
    expect(data.pagination.totalPages).toBe(2);
  });

  it("35. pagination can retrieve the second page", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        page: "2",
        limit: "2",
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.tasks.length).toBe(1);
    expect(data.pagination.page).toBe(2);
  });

  it("36. tasks can be sorted by title in ascending order", async () => {
    const req = httpMocks.createRequest({
      method: "GET",
      query: {
        sortBy: "title",
        sortDirection: "asc",
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(index, req, res);

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.tasks[0].title).toBe("Apple meeting");
    expect(data.tasks[1].title).toBe("Apple task");
    expect(data.tasks[2].title).toBe("Banana task");
  });
});

describe("testing Assignment 11 bulk delete feature", () => {
  it("37. bulk delete rejects an empty ids array", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      body: {
        ids: [],
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(
      bulkDeleteTasks,
      req,
      res,
    );

    const data = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(data.error).toBe("ids must be a non-empty array");
  });

  it("38. bulk delete rejects invalid task ids", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      body: {
        ids: ["not-a-number"],
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(
      bulkDeleteTasks,
      req,
      res,
    );

    const data = res._getJSONData();

    expect(res.statusCode).toBe(400);
    expect(data.error).toBe(
      "All task IDs must be valid numbers",
    );
  });

  it("39. user1 can bulk delete multiple of their own tasks", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      body: {
        ids: [bulkTask1.id, bulkTask2.id],
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(
      bulkDeleteTasks,
      req,
      res,
    );

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.message).toBe("Tasks deleted successfully");
    expect(data.deletedCount).toBe(2);
  });

  it("40. bulk deleted tasks are no longer in the database", async () => {
    const deletedTasks = await prisma.Task.findMany({
      where: {
        id: {
          in: [bulkTask1.id, bulkTask2.id],
        },
      },
    });

    expect(deletedTasks.length).toBe(0);
  });

  it("41. user1 cannot bulk delete a task belonging to user2", async () => {
    const req = httpMocks.createRequest({
      method: "DELETE",
      body: {
        ids: [user2Task.id],
      },
    });

    req.user = { id: user1.id };

    const res = httpMocks.createResponse({
      eventEmitter: EventEmitter,
    });

    await waitForRouteHandlerCompletion(
      bulkDeleteTasks,
      req,
      res,
    );

    const data = res._getJSONData();

    expect(res.statusCode).toBe(200);
    expect(data.deletedCount).toBe(0);
  });

  it("42. user2 task still exists after user1 bulk delete attempt", async () => {
    const task = await prisma.Task.findFirst({
      where: {
        id: user2Task.id,
        userId: user2.id,
      },
    });

    expect(task).not.toBeNull();
    expect(task.title).toBe("Alice private task");
  });
});