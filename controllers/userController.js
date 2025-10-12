const ApiError = require('../error/ApiError');
const bcrypt = require('bcrypt')
const jwt = require('jsonwebtoken')
const {User} = require('../models/models');


const generateJwt = (id, email, role) => {
    return jwt.sign(
        {id, email, role},
        process.env.SECRET_KEY,
        {expiresIn: '24h'}
    )
}


class UserController {
  async registration(req, res, next) {
    const { email, password, role, name, surname, patronymic, dateOfBirth } = req.body;

    if (!email || !password || !name || !role || !surname || !patronymic || !dateOfBirth  ) {
      return next(ApiError.badRequest("Заполните данные пользователя"));
    }
    const candidate = await User.findOne({ where: { email } });
    if (candidate) {
      return next(
        ApiError.badRequest("Пользователь с таким email уже существует")
      );
    }
    const hashPassword = await bcrypt.hash(password, 5);
    const user = await User.create({
      email,
      role,
      name,
      surname,
      patronymic,
      dateOfBirth,
      password: hashPassword,
    });

    if (user) {
      return next(ApiError.badRequest("Пользователь успешно создан"));
    }
  }

  // Авторизация пользователя
  async login(req, res, next) {
    const { email, password } = req.body;
    const user = await User.findOne({ where: { email } });
    // Проверяем емаил пользователя
    if (!user) {
      return next(ApiError.internal("Пользователь не найден"));
    }
    // Проверяем пароль
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.internal("Указан неверный пароль"));
    }
    // Проверяем статус блокировки пользователя
    if (user.isBlocked === true) {
      return next(
        ApiError.forbidden("Доступ запрещен, Ваш аккаунт заблокирован")
      );
    }
    // Измененине статуса пользователя после успешной авторизации
    if (user) {
      await User.update(
        {
          status: "active",
        },
        {
          where: {
            id: user.id,
          },
        }
      );
    }
    // Возвращаем id, емаил и роль пользователя
    const token = generateJwt(user.id, user.email, user.role);

    return res.json({ token });
  }
  // Изменение статуса пользователя при выходе
  async logout(req, res, next) {
    const { id } = req.body;

    try {
      const logoutUser = await User.update(
        {
          status: "inactive",
        },
        {
          where: {
            id,
          },
        }
      );

      return res.json(logoutUser);
    } catch (error) {
      return next(ApiError.internal("Ошибка выхода"));
    }
  }

  async check(req, res, next) {
    try {
      const token = generateJwt(
        req.user.id,
        req.user.email,
        req.user.role,
        req.user.surname
      );
      return res.json({ token });
    } catch (error) {
      return next(ApiError.internal("Пользователь не найден"));
    }
  }
  // Получение всех пользователей с ролью USER и постраничный вывод
  async allUsers(req, res) {
    let {} = req.query;
    // Получаем номер страницы и лимит из запроса
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 3;
    const offset = (page - 1) * limit;

    try {
      const { count, rows } = await User.findAndCountAll({
        // Получаем пользователей с ролью USER
        where: {
          role: "USER",
        },
        offset: offset,
        limit: limit,
        // Сортировка по дате от новых к старым
        order: [["createdAt", "ASC"]],
      });

      return res.json({
        all: rows,
        totalPages: Math.ceil(count / limit),
        currentPage: page,
      });
    } catch (error) {}
  }

  // Получение данных одного пользователя
  async getOneUser(req, res, next) {
    let { id, userid } = req.query;

    try {
      // Полчаем по id пользователя
      const checkUserData = await User.findOne({
        where: {
          id,
        },
      }); 
      // Проверяем, что пользователь ввел id
      if (userid === "") {
        return next(ApiError.forbidden("Введите ваш ID"));
      }
      // Проверяем, что id пользователя соотвестствует заправшиваемому id, а если не соотвествует, то проверяем роль - админу доступны данные все пользователей по id. 
      if (checkUserData.id != userid && checkUserData.role != "ADMIN") {
        return next(ApiError.forbidden("Нарушение прав доступа"));
      }
      const oneUSer = await User.findOne({
        where: {
          id: userid,
        },
      });

      if (!oneUSer) {
        return next(ApiError.internal(`Пользователь с id ${userid} не найден`));
      }
      return res.json(oneUSer);
    } catch (error) {}
  }

  async userBlockedByAdmin(req, res, next) {
    let { email, adminemail, password, id } = req.body;

    let blocking;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(ApiError.forbidden("Пользователь не найден"));
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.forbidden("Указан неверный пароль"));
    }
    if (user.email != adminemail) {
      return next(ApiError.forbidden("Введите свой email и пароль"));
    }
    if (user) {
      blocking = await User.update(
        {
          isBlocked: true,
        },
        {
          where: {
            id,
          },
        }
      );
      if (blocking) {
        return next(ApiError.forbidden(`Пользователь с id ${id} заблокирован`));
      }

      return res.json(blocking);
    }
  }

  async userBlocked(req, res, next) {
    let { email, useremail, password, id } = req.body;

    let blocking;
    const user = await User.findOne({ where: { email } });
    if (!user) {
      return next(ApiError.forbidden("Пользователь не найден"));
    }
    let comparePassword = bcrypt.compareSync(password, user.password);
    if (!comparePassword) {
      return next(ApiError.forbidden("Указан неверный пароль"));
    }
    if (user.email != useremail) {
      return next(ApiError.forbidden("Введите свой email и пароль"));
    }
     if (user.role === 'ADMIN') {
      return next(ApiError.forbidden("Администратор не может заблокировать свой аккаунт"));
    }
    if (user) {
      blocking = await User.update(
        {
          isBlocked: true,
        },
        {
          where: {
            id,
          },
        }
      );
      if (blocking) {
        return next(ApiError.forbidden(`Пользователь с id ${id} заблокирован`));
      }

      return res.json(blocking);
    }
  }
}



module.exports = new UserController()






