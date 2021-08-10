// libs
const fs = require("fs");
const path = require("path");
const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();
// routes
const usersRoutes = require("./routes/users-routes");
const childsRoutes = require("./routes/childs-routes");
const growNotesRoutes = require("./routes/grow-notes-routes");
const heightNotesRoutes = require("./routes/height-notes-routes");
const weightNotesRoutes = require("./routes/weight-notes-routes");
const milkNotesRoutes = require("./routes/milk-notes-routes");
const statusRoutes = require("./routes/status-routes");
const authsRoutes = require("./routes/auth-routes");
const imagesRoutes = require("./routes/image-routes");
const appointmentsRoutes = require("./routes/appointment-routes");
const notesRoutes = require("./routes/note-routes");
const commentsRoutes = require("./routes/comment-routes");
const guideRoutes = require("./routes/guide-routes");
const markerRoutes = require("./routes/marker-routes");
const vaccinationRoutes = require("./routes/vaccination-routes");
const weanRoutes = require("./routes/wean-routes");
const messageRoutes = require("./routes/message-routes");
const notificationRoutes = require("./routes/notification-routes");
const activityRoutes = require("./routes/activity-routes");
const webHooks = require("./routes/webhook");
//swagger
const swaggerUi = require("swagger-ui-express");
const { swaggerSpec, swaggerTheme } = require("./configs/swagger.js");

// socket
const SocketSever = require("./socket/SocketServer");

const app = express();

// socket
const server = require("http").createServer(app);
const io = require("socket.io")(server, {
    cors: {
        origin: "*",
    },
    allowEIO3: true,
});

io.on("connection", (socket) => {
    SocketSever(io, socket);
});

//Passport initialize
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// use routers
app.use(
    "/docs",
    swaggerUi.serve,
    swaggerUi.setup(swaggerSpec, { customCss: swaggerTheme })
);
app.get("/swagger.json", function (req, res) {
    res.setHeader("Content-Type", "application/json");
    res.send(swaggerSpec);
});
app.use("/uploads/images", express.static(path.join("uploads", "images")));
app.use("/api/auths", authsRoutes);
app.use("/api/users", usersRoutes);
app.use("/api/childs", childsRoutes);
app.use("/api/grownotes", growNotesRoutes);
app.use("/api/heightnotes", heightNotesRoutes);
app.use("/api/weightnotes", weightNotesRoutes);
app.use("/api/milknotes", milkNotesRoutes);
app.use("/api/status", statusRoutes);
app.use("/api/images", imagesRoutes);
app.use("/api/appointments", appointmentsRoutes);
app.use("/api/notes", notesRoutes);
app.use("/api/comments", commentsRoutes);
app.use("/api/guides", guideRoutes);
app.use("/api/markers", markerRoutes);
app.use("/api/vaccinations", vaccinationRoutes);
app.use("/api/weans", weanRoutes);
app.use("/api/messages", messageRoutes);
app.use("/api/notifications", notificationRoutes);
app.use("/api/activities", activityRoutes);
app.use("/webhook", webHooks);

app.get("/", (req, res) => {
    res.send("Server on");
});

app.get("/api/setting", (req, res) => {
    res.json({
        message: "Success",
        status: 200,
        data: {
            webDomain: process.env.CLIENT_URL,
        },
    });
});

// handle error
app.use((req, res, next) => {
    res.status(404).json({
        message: "Could not find this route.",
    });
});

app.use((error, req, res, next) => {
    if (req.file) {
        fs.unlink(req.file.path, (err) => {
            console.log(err);
        });
    }
    if (res.headerSent) {
        return next(error);
    }
    res.status(error.code || 500);
    res.json({ message: error.message || "An unknown error occurred!" });
});

mongoose
    .connect(
        `mongodb+srv://${process.env.DB_USER}:${process.env.DB_PASSWORD}@cluster0.0ka3b.mongodb.net/${process.env.DB_NAME}?retryWrites=true&w=majority`,
        {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            useCreateIndex: true,
            useFindAndModify: false,
        }
    )
    .then(() => {
        server.listen(process.env.PORT || 80, () => console.log("Server On"));
    })
    .catch((err) => {
        console.log(err);
    });
