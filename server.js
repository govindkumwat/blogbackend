const express = require('express');
const mongoose = require('mongoose');
const connectDB = require('./connectDB');
const multer = require('multer');
const Posts = require('./models/postModel')
const Image = require('./models/Image')
const Comment = require('./models/commentModel')
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('./models/UserModel');
const cors = require('cors');
const path = require('path')
const postView = require('./models/setPostViewModel')


const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, "./uploads")
    },
    filename: (req, file, cb) => {
        console.log(file)
        cb(null, Date.now() + path.extname(file.originalname))
    }
})

const upload = multer({storage})

const app = express();
const port = 3000;
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cors());
const corsOptions = {
    origin: 'http://localhost:3000',
    optionsSuccessStatus: 200, // some legacy browsers (IE11, various SmartTVs) choke on 204
};
app.use(cors(corsOptions));
app.use(express.json());
const secretKey = crypto.randomBytes(32).toString('hex');


app.get('/', (req, res) => {
    res.send('Use endpoint to access the api ');
});

app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});


const extractUserMiddleware = (req, res, next) => {
    const token = req.headers.authorization && req.headers.authorization.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authorization token is missing' });
    }
    try {
        const decodedToken = jwt.verify(token, secretKey);
        req.user = decodedToken;
        next();
    } catch (error) {
        console.log(error.message); // Log the error message
        return res.status(401).json({ message: 'Invalid token' });
    }
};

    app.get('/user-details', extractUserMiddleware, async (req, res) => {
    try {
        // Access user details from req.user
        const userId = req.user.userId;

        // Fetch user details from the database or perform other actions
        const user = await User.findById(userId);

        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }

        // Send user details in the response
        res.status(200).json({
            userId: user._id,
            name: user.name,
            username: user.username,
            email: user.email,
            role_id: user.role_id
            // Add other user details as needed
        });
    } catch (error) {
        localStorage.removeItem('token')
        console.log(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});


    app.post('/signup', async (req, res) => {
    try {
        const { name, username, email, password, role_id } = req.body;

        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'User already exists' });
        }

        // Hash the password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Create a new user
        const user = await User.create({
            name,
            username,
            email,
            password: hashedPassword,
            role_id,
        });

        // Generate a token for the user
        const token = jwt.sign({ userId: user._id }, secretKey, {
            expiresIn: '24h',
        });

        res.status(201).json({ user, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

// Login endpoint
app.post('/login', async (req, res) => {
    try {
        const { username, email, password } = req.body;

        // Check if either email or username is provided
        if (!(email || username)) {
            return res.status(400).json({ message: 'Email or username is required' });
        }

        // Find the user based on email, if provided; otherwise, use username
        const user = await User.findOne({ email }) || await User.findOne({ username });

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Compare the provided password with the hashed password in the database
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        // Generate a token for the user
        const token = jwt.sign({ userId: user._id }, secretKey, { expiresIn: '1h', algorithm: 'HS256' });

        res.status(200).json({ user, token });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});



    app.post('/logout', async (req, res) => {
    try {
        // Remove the token from the request object
        req.logOut();
        // Send back a response that the log out was successful
        res.status(200).send({ message: "Logged Out!" })
    } catch (err) {
        console.log(err);
        res.status(500).json({ message: err.message });

    }
})


app.get('/posts', async (req, res) => {
    try {
        // Get the page number, items per page, search query, and tags from query parameters
        const page = parseInt(req.query.page) || 1;
        const perPage = parseInt(req.query.perPage) || 5;
        const searchQuery = req.query.search || '';
        const tagsQuery = req.query.tags || '';

        // Create regular expressions for case-insensitive search
        const searchRegex = new RegExp(searchQuery, 'i');
        const tagsRegex = new RegExp(tagsQuery, 'i');

        // Calculate the skip value based on the page number and items per page
        const skip = (page - 1) * perPage;

        // Build the query object based on both search and tags criteria
        const query = {
            $or: [
                { title: searchRegex },
                { content: searchRegex }
            ],
            tags: tagsRegex !== undefined ? tagsRegex : '' // Include tags in the search criteria
        };

        // Fetch total number of posts with the combined criteria
        const totalPosts = await Posts.countDocuments(query);

        // Fetch posts with pagination and combined search criteria
        let posts = await Posts.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(perPage);

        // Fetch post views for each post and add to the posts array
        posts = await Promise.all(posts.map(async (post) => {
            const PostView = await postView.findOne({ postId: post._id });
            return { ...post.toObject(), postView: PostView ? PostView.totalPageView : 0 };
        }));

        // Calculate total number of pages
        const totalPages = Math.ceil(totalPosts / perPage);

        res.status(200).json({
            posts,
            pageInfo: {
                totalPosts,
                totalPages,
                currentPage: page,
                lastPage: totalPages,
                TaggedSearch : tagsRegex || ''
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

//Get top post by view 

app.get('/toppost', async (req, res) => {
    try {
        const topPosts = await Posts.aggregate([
            {
                $lookup: {
                    from: 'postviews',
                    localField: '_id',
                    foreignField: 'postId',
                    as: 'postViews'
                }
            },
            {
                $addFields: {
                    postViewCount: { $sum: '$postViews.totalPageView' }
                }
            },
            {
                $sort: { postViewCount: -1 }
            },
            {
                $limit: 5
            },
            {
                $project: {
                    _id: 1,
                    title: 1,
                    content: 1,
                    tags: 1,
                    postViewCount: 1
                }
            }
        ]);

        console.log('Top Posts:', topPosts); // Log the retrieved top posts

        res.status(200).json({
            topPosts
        });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});





app.put('/setPostView', async (req, res) => {
    const { postId, totalPageView } = req.body;
    try {
        let existingPostView = await postView.findOne({ postId });
        if (existingPostView) {
            // Update existing record
            existingPostView.totalPageView = totalPageView;
            await existingPostView.save();
            res.status(200).json(existingPostView);
        } else {
            // Create new record
            const newPostView = await postView.create({
                postId,
                totalPageView
            });
            res.status(200).json(newPostView);
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
});


    app.get('/getcomments', async (req, res) => {

    try {
        const comments = await Comment.find({});
        res.status(200).json(comments);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

    app.get('/getcomment/:id', async (req, res) => {
    const commentId = req.params.id;

    try {
        const comment = await Comment.find({ id: commentId });

        // if (!comment) {
        //     return res.status(404).json({ message: 'Comment not found' });
        // }

        res.status(200).json(comment);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});





app.post('/savepost', upload.single('file'), async (req, res) => {

    try {
        const { userId, userName, title, description, tags, thumbs } = req.body;

        const post = await Posts.create({
            userId,
            userName,
            title,
            description,
            tags,
            thumbs
        });

        res.status(200).json(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});


app.post('/savecomments', async (req, res) => {

    try {
        const { id, comment, name, email } = req.body;
        const post = await Comment.create({
            id,
            comment,
            name,
            email
        });

        res.status(200).json(post);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});



app.get('/posts/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        const post = await Posts.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Fetch post views for the specified post ID
        const PostView = await postView.findOne({ postId });

        // Create a new object combining post details and post view count
        const postDetails = {
            ...post.toObject(),
            postView: PostView ? PostView.totalPageView : 0
        };

        res.status(200).json(postDetails);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});


//save total post view in pageView Table




app.delete('/deletepost/:id', async (req, res) => {
    const postId = req.params.id;

    try {
        // Check if the post exists
        const post = await Posts.findById(postId);

        if (!post) {
            return res.status(404).json({ message: 'Post not found' });
        }

        // Delete the post
        await Posts.findByIdAndDelete(postId);

        // Optionally, delete associated images or perform other cleanup tasks

        res.status(200).json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});
app.get('/user-posts/:userId', async (req, res) => {
    const userId = req.params.userId;

    try {
        const userPosts = await Posts.find({ userId });

        if (userPosts.length === 0) {
            return res.status(404).json({ message: 'No posts found for the user' });
        }

        res.status(200).json(userPosts);
    } catch (error) {
        console.log(error);
        res.status(500).json({ message: error.message });
    }
});

app.listen(port, () => {
    console.log(`Example app listening at http://localhost:${port}`);
});

connectDB()
