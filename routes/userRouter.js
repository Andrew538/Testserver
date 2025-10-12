const Router = require('express')
const router = new Router()
const userController = require('../controllers/userController')
const authMiddleware = require('../middleware/authMiddleware')
const checkRoleMiddleware = require('../middleware/checkRoleMiddleware')
const checkAuthMiddleware = require('../middleware/checkAuthMiddleware')

// Регистрация пользователя доступна админу
router.post('/registration', checkRoleMiddleware('ADMIN'), userController.registration)

// Авторизация пользователя
router.post( '/login', userController.login)

// Изменнение статуса пользователя после выхода
router.post( '/logout', userController.logout)

// Проверка авторизации
router.get('/auth', authMiddleware, userController.check)

// получение всех пользователей доступно только админу
router.get('/alluser', checkRoleMiddleware('ADMIN'), userController.allUsers)

// Пользователь может получить свои данные после авторизации, админ также может получить данные одного пользователя
router.get('/oneuser', checkAuthMiddleware(), userController.getOneUser)

// Блокировка пользователя админом
router.post('/userblockingbyadmin', checkRoleMiddleware('ADMIN'),  userController.userBlockedByAdmin)

// Пользователь блокирует себя
router.post('/userblocking', checkAuthMiddleware(),  userController.userBlocked)



module.exports = router