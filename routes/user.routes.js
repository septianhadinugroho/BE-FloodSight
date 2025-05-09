const bcrypt = require('bcrypt');
const User = require('../models/user.model');

module.exports = [
    {
        method: 'POST',
        path: '/register',
        options: {
            payload: {
                parse: true,
                allow: 'application/json'
            }
        },
        handler: async (request, h) => {
            try {
                const { name, email, city, longitude, latitude, password } = request.payload;
                if (!name || !email || !password) {
                    return h.response({ error: 'Name, email, dan password wajib diisi.' }).code(400);
                }

                const existingUser = await User.findOne({ email });
                if (existingUser) {
                    return h.response({ error: 'Email sudah terdaftar.' }).code(400);
                }

                const hashedPassword = await bcrypt.hash(password, 10);

                const user = new User({
                    name: name.trim(),
                    email: email.toLowerCase(),
                    city,
                    longitude,
                    latitude,
                    password: hashedPassword
                });

                const savedUser = await user.save();
                return h.response(savedUser).code(201);
            } catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }
    },

    {
        method: 'POST',
        path: '/login',
        options: {
            payload: {
                parse: true,
                allow: 'application/json'
            }
        },
        handler: async (request, h) => {
            try {
                const { email, password } = request.payload;
                const user = await User.findOne({ email });

                if (!user) {
                    return h.response({ error: 'Email tidak ditemukan.' }).code(401);
                }

                const match = await bcrypt.compare(password, user.password);
                if (!match) {
                    return h.response({ error: 'Password salah.' }).code(401);
                }

                return h.response({ message: 'Login berhasil', user }).code(200);
            } catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }
    },

    {
        method: 'GET',
        path: '/users',
        handler: async (request, h) => {
            try {
                const users = await User.find();
                return h.response(users).code(200);
            } catch (error) {
                return h.response({ error: error.message }).code(500);
            }
        }
    },

{
    method: 'PUT',
    path: '/users/{id}',
    handler: async (request, h) => {
        const userId = request.params.id;  
        const { name, email, city, longitude, latitude, password } = request.payload;

        try {
            const updatedUser = await User.findByIdAndUpdate(userId, {  
                name, email, city, longitude, latitude, password
            }, { new: true });

            if (!updatedUser) {
                return h.response({ error: 'User not found' }).code(404);
            }
            return h.response(updatedUser).code(200);
        } catch (error) {
            console.error('Error saat update user:', error);
            return h.response({ error: error.message }).code(500);
        }
    }
},

{
    method: 'DELETE',
    path: '/users/{id}',
    handler: async (request, h) => {
        const userId = request.params.id;  

        try {
            const deletedUser = await User.findByIdAndDelete(userId);  

            if (!deletedUser) {
                return h.response({ error: 'User not found' }).code(404);
            }
            return h.response({ message: 'User deleted successfully' }).code(200);
        } catch (error) {
            console.error('Error saat delete user:', error);
            return h.response({ error: error.message }).code(500);
        }
    }
}
];