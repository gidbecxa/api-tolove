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
    phoneNumber: yup.string().required().trim(),
    code: yup.string().required().length(6)
});

exports.loginAdminSchema = yup.object({
    usernameOrEmail: yup.string().required().trim(),
    phoneNumber: yup.string().required(),

});

exports.updateProfilePartOneSchema = yup.object({
    username: yup.string().required(errorTypeOne),
    genre: yup.string().required().oneOf(["male", "female", "neutre"], "Genre invalide"),
    preference: yup.string().required().oneOf(["male", "female", "neutre"], "Genre invalide"),
    preferencePays: yup.string().required(errorTypeOne),
    birthday: yup.date().required(),
    ville: yup.string().required(errorTypeOne)
});

exports.updateProfilePartTwoSchema = yup.object({
    image: yup.string().required(errorTypeOne),
    // hobbies: yup.string().required(errorTypeOne),
    description: yup.string().required(errorTypeOne),
    // preferencePays: yup.string().required(errorTypeOne),
    disponiblePour: yup.string().required(errorTypeOne),
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

exports.agentUserSchema = yup.object({
    phoneNumber: yup.string().required('Phone number is required'),
    username: yup.string().required('Username is required'),
    birthday: yup.date().required('Birthday is required'),
    description: yup.string().required('Description is required'),
    preference: yup.string().required('Preference is required'),
    genre: yup.string().required('Genre is required'),
    passion: yup.string().required('Passion is required'),
    pays: yup.string().required('Pays is required'),
    villes: yup.string().required('Villes is required'),
});

// COUNTRY VALIDATION SCHEMAS

exports.addCountrySchema = yup.object({
    name: yup.string().required(errorTypeOne)
});

// CITY VALIDATION SCHEMAS

exports.addCitySchema = yup.object({
    name: yup.string().required(errorTypeOne)
});

// SUBSCRIPTION VALIDATION SCHEMAS

exports.addSubscriptionSchema = yup.object({
    name: yup.string().required('Name is required'),
    status: yup.string().required('Status required'),
});

// COMPANY VALIDATION SCHEMAS

exports.companyRegisterSchema = yup.object({
    phoneNumber: yup.string().required(errorTypeOne),
    // password: yup.string().required(errorTypeOne).matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)[a-zA-Z\d]{8,}$/, "Minimum huit caractères, au moins une lettre majuscule, une lettre minuscule et un chiffre")
});

exports.companyVerifySchema = yup.object().shape({
    code: yup.string().required().length(6)
});

exports.companyLoginSchema = yup.object({
    usernameOrEmail: yup.string().required().trim(),
    password: yup.string().required()

});

exports.companySubscriptionSchema = yup.object({
    companyId: yup.string().required('Company ID is required'),
    subscriptionId: yup.string().required('Subscription ID is required')
});

// CARTE VALIDATION SCHEMAS
exports.addCarteSchema = yup.object({
    name: yup.string().required('Name is required'),
    OpenDaysTime: yup.string().required('Open Days and Times are required'),
    countryId: yup.string().required('Country ID is required'),
    cityId: yup.string().required('City ID is required'),
    // image: yup.string().required('Image is required'),
    typeCarte: yup.string().required('Carte Type is required'),
});

exports.updateCarteSchema = yup.object({
    name: yup.string().required('Name is required'),
    OpenDaysTime: yup.string().required('Open Days and Times are required'),
    countryId: yup.string().required('Country is required'),
    cityId: yup.string().required('City is required'),
    image: yup.string().required('Image is required'),
});

exports.likeCarteSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    carteId: yup.string().required('Carte ID is required'),
});

exports.unLikeCarteSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    carteId: yup.string().required('Carte ID is required'),
});

exports.addNewPhotoCarteSchema = yup.object({
    path_url: yup.string().required('Image path URL is required'),
    carteId: yup.string().required('Carte ID is required'),
});

exports.updateCompanySchema = yup.object({
    username: yup.string().required(errorTypeOne),
    category: yup.string().required().oneOf(["restaurant", "activités", "cadeau", "hôtel", "transport"], "Genre invalide"),
    // country: yup.string().required(),
    email: yup.string().required(errorTypeOne).email("Email Invalide"),
    city: yup.string().required(errorTypeOne),
    numeroSocial: yup.string().required(),
});