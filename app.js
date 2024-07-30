const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();
const url = 'mongodb://localhost:27017/todoListDB';

app.set("view engine", "ejs");
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.static("public"));

async function connectToMongo() {
    try {
        await mongoose.connect(url);
        console.log('Connected to MongoDB server');
    } catch (error) {
        console.error('Error connecting to MongoDB:', error);
    }
}
connectToMongo();

const itemSchema = new mongoose.Schema({ 
    title: String,
    description: String,
    time: String
});

const listSchema = new mongoose.Schema({
    listname: String,
    items: [itemSchema]
});

const Listwork = mongoose.model('List', listSchema);

app.post('/delete', async (req, res) => {
    const pagename = req.body.customList;
    const taskDelete = req.body.delete;
    try {
        await Listwork.updateOne(
            { listname: pagename },
            { $pull: { items: { _id: taskDelete } } }
        );
    } catch (err) {
        console.error('Error deleting task:', err);
    }
    res.redirect("/" + pagename);
});
app.post('/deletelist', async (req, res) => {
    const taskDelete = req.body.deletelist;
    try {
        await Listwork.deleteOne({ listname: taskDelete });
    } catch (err) {
        console.error('Error deleting list:', err);
    }
    res.redirect("/");
});

app.post('/newlist', async (req, res) => {
    const listname = req.body.newlistname;
    try {
        const list = new Listwork({ listname: listname, items: [] });
        await list.save();
    } catch (err) {
        console.error('Error creating list:', err);
    }
    res.redirect("/" + listname);
});

// Route for root URL
app.get("/", (req, res) => res.redirect("/Home"));

app.get('/:webname', async (req, res) => {
    const pagename = req.params.webname === "" ? "Home" : req.params.webname;

    try {
        const lists = await Listwork.find({listname:{$ne:"Home"}});
        let list = await Listwork.findOne({ listname: pagename });
        if (!list && pagename === "Home") {
            list = new Listwork({ listname: "Home", items: [] });
            await list.save();
        }
        if (list) {
            res.render('list', { pagename: pagename, tasktodo: list.items, List: lists });
        } else {
            res.redirect("/");
        }
    } catch (err) {
        console.error('Error fetching list:', err);
    }
});

app.post('/:webname', async (req, res) => {
    const currentTime = new Date();
    const formattedTime = currentTime.toLocaleString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric', hour12: true });
    const formattedDate = currentTime.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    const time = `${formattedTime} ${formattedDate}`;
    const webpage = req.params.webname === "" ? "Home" : req.params.webname;
    const title = req.body.Title;
    const description = req.body.Description;

    try {
        let list = await Listwork.findOne({ listname: webpage });
        if (!list) {
            list = new Listwork({ listname: webpage, items: [] });
        }
        list.items.push({ title: title, description: description, time: time });
        await list.save();
    } catch (err) {
        console.error('Error adding task:', err);
    }
    res.redirect("/" + webpage);
});

app.listen(3000, () => {
    console.log("Server started on port 3000");
});
