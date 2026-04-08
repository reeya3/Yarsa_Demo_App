"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
const userController_1 = require("./controllers/userController");
const app = (0, express_1.default)();
app.use(express_1.default.json());
// Root route
app.get('/', (req, res) => {
    res.send('Yarsa Demo API is running! Use /users endpoints');
});
app.use('/users', userRoutes_1.default);
const start = async () => {
    await (0, userController_1.initDB)();
    const PORT = 3001;
    app.listen(PORT, () => {
        console.log(`Yarsa Demo running on port ${PORT}`);
    });
};
start();
