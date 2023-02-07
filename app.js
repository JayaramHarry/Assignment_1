const express = require("express");
const path = require("path");
const { open } = require("sqlite");
const sqlite3 = require("sqlite3");
const format = require("date-fns/format");
const isValid = require("date-fns/isValid");
const app = express();
app.use(express.json());

const dbPath = path.join(__dirname, "todoApplication.db");

let db = null;

const initializeDBAndServer = async () => {
  try {
    db = await open({
      filename: dbPath,
      driver: sqlite3.Database,
    });
    app.listen(3000, () =>
      console.log("Server Running at http://localhost:3000/")
    );
  } catch (e) {
    console.log(`DB Error: ${e.message}`);
    process.exit(1);
  }
};

initializeDBAndServer();

const convertDbObjectToResponseObject = (dbObject) => {
  return {
    id: dbObject.id,
    todo: dbObject.todo,
    priority: dbObject.priority,
    status: dbObject.status,
    category: dbObject.category,
    dueDate: dbObject.due_date,
  };
};

const hasPriorityStatusAndProperties = (requestQuery) => {
  return (
    requestQuery.priority !== undefined &&
    requestQuery.status !== undefined &&
    requestQuery.category !== undefined &&
    requestQuery.dueDate !== undefined
  );
};

const hasPriorityProperty = (requestQuery) => {
  return requestQuery.priority !== undefined;
};

const hasStatusProperty = (requestQuery) => {
  return requestQuery.status !== undefined;
};
const hasCategoryProperty = (requestQuery) => {
  return requestQuery.category !== undefined;
};

const hasDueDateProperty = (requestQuery) => {
  return requestQuery.dueDate !== undefined;
};

//API 1

app.get("/todos/", async (request, response) => {
  let data = null;
  let getTodoQuery = "";
  const { search_q = "", priority, status, category, dueDate } = request.query;

  switch (true) {
    case hasPriorityProperty(request.query):
      if (hasPriorityProperty) {
        getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%'
            AND priority = '${priority}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case hasStatusProperty(request.query):
      if (hasStatusProperty !== undefined) {
        getTodoQuery = `
                SELECT * FROM todo
                WHERE todo LIKE '%${search_q}%' 
                AND status = '${status}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case hasCategoryProperty(request.query):
      if (hasCategoryProperty !== undefined) {
        getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%' AND
            category = '${category}';`;
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case hasDueDateProperty(request.query):
      if (hasDueDateProperty !== undefined) {
        getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%' AND
            due_date = '${dueDate}';`;
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
    default:
      getTodoQuery = `
            SELECT * FROM todo
            WHERE todo LIKE '%${search_q}%';`;
      break;
  }
  data = await db.all(getTodoQuery);
  response.send(data.map((each) => convertDbObjectToResponseObject(each)));
});

//API 2

app.get("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;

  const getTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE
      id = ${todoId};`;
  const todo = await db.get(getTodoQuery);
  response.send(convertDbObjectToResponseObject(todo));
});

//API 3
app.get("/agenda/", async (request, response) => {
  const date = format(new Date(2021, 1, 21), "yyyy-MM-dd");
  console.log(date);
  const getDateQuery = `SELECT * FROM todo WHERE due_date = '${date}';`;
  const result = await db.all(getDateQuery);
  response.send(result);
  console.log(result);
});

//API 4
app.post("/todos/", async (request, response) => {
  const { id, todo, priority, status, category, dueDate } = request.body;
  let updateColumn = "";
  const requestBody = request.body;
  switch (true) {
    case requestBody.status !== "TO DO" || "IN PROGRESS" || "DONE":
      updateColumn = "Status";
      break;
    case requestBody.priority !== "LOW" || "HIGH" || "MEDIUM":
      updateColumn = "Priority";
      break;
    case requestBody.category !== "WORK" || "HOME" || "LEARNING":
      updateColumn = "Category";
      break;
    default:
      const postTodoQuery = `
            INSERT INTO todo
            VALUES (
            '${id}',
            '${todo}',
            '${priority}',
            '${status}',
            '${category}',
            '${dueDate}'
            );`;
      await db.run(postTodoQuery);
      response.send("Todo Successfully Added");
  }
  response.status(400);
  response.send(`Invalid Todo ${updateColumn}`);
});

//API 5
app.put("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  let updateColumn = "";
  let isValid = null;
  const requestBody = request.body;
  const previousTodoQuery = `
    SELECT
      *
    FROM
      todo
    WHERE 
      id = ${1};`;
  const previousTodo = await db.get(previousTodoQuery);

  const {
    todo = previousTodo.todo,
    priority = previousTodo.priority,
    status = previousTodo.status,
    category = previousTodo.category,
    dueDate = previousTodo.dueDate,
  } = request.body;
  switch (true) {
    case requestBody.status !== undefined:
      if (true) {
        updateColumn = "Status";
      } else {
        response.status(400);
        response.send("Invalid Todo Status");
      }
      break;
    case requestBody.priority !== undefined:
      if (true) {
        updateColumn = "Priority";
      } else {
        response.status(400);
        response.send("Invalid Todo Priority");
      }
      break;
    case requestBody.todo !== undefined:
      if (true) {
        updateColumn = "Todo";
      } else {
        response.status(400);
        response.send("Invalid Todo");
      }
      break;
    case requestBody.category !== undefined:
      if (true) {
        updateColumn = "Category";
      } else {
        response.status(400);
        response.send("Invalid Todo Category");
      }
      break;
    case requestBody.dueDate !== undefined:
      if (true) {
        updateColumn = "Due Date";
      } else {
        response.status(400);
        response.send("Invalid Due Date");
      }
      break;
  const updateTodoQuery = `
        UPDATE
        todo
        SET
        todo='${todo}',
        priority='${priority}',
        status='${status}',
        category='${category}',
        due_date='${dueDate}'
        WHERE
        id = '${todoId}';`;
  await db.run(updateTodoQuery);
  response.send(`${updateColumn} Updated`);
});

//API 6
app.delete("/todos/:todoId/", async (request, response) => {
  const { todoId } = request.params;
  const deleteTodoQuery = `
  DELETE FROM
    todo
  WHERE
    id = ${todoId};`;

  await db.run(deleteTodoQuery);
  response.send("Todo Deleted");
});

module.exports = app;
