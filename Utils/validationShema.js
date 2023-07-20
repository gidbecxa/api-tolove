const yup = require("yup");
const dayjs = require('dayjs')

const errorTypeOne = "Tous les champs sont obligatoires"

exports.registerSchema = yup.object({
    pays: yup.string().required(errorTypeOne),
    phoneNumber: yup.string().required(errorTypeOne),
    // password: yup.string().required(errorTypeOne).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Minimum huit caractères, au moins une lettre majuscule, une lettre minuscule et un chiffre")
});

exports.verifySchema = yup.object().shape({
    code: yup.string().required().length(6)
});

exports.loginSchema = yup.object({
    usernameOrEmail: yup.string().required().trim(),
    password: yup.string().required()

});

exports.updateProfilePartOneSchema = yup.object({
    username: yup.string().required(errorTypeOne),
    genre: yup.string().required().oneOf(["male", "female", "neutre"], "Genre invalide"),
    preference: yup.string().required().oneOf(["male", "female", "neutre"], "Genre invalide"),
    birthday: yup.date().required(),
    ville: yup.string().required(errorTypeOne)
});

exports.updateUserSchema = yup.object({
    email: yup.string().required(errorTypeOne).email("Email Invalide"),
    password: yup.string().required(),
});

exports.updateHobbiesSchema = yup.object({
    hobbies: yup.array().of(yup.string()).required(errorTypeOne)
});

exports.updateUserDescriptionSchema = yup.object({
    description: yup.string().required(errorTypeOne)
});

exports.updateUserPhotoSchema = yup.object({
    photoProfil: yup.string().required(errorTypeOne)
});