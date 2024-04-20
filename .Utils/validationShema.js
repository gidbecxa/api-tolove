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

exports.updateCountrySchema = yup.object({
    name: yup.string().required(errorTypeOne)
});

exports.deleteCountrySchema = yup.object({
    id: yup.string().required('ID is required')
});

// CITY VALIDATION SCHEMAS

exports.addCitySchema = yup.object({
    name: yup.string().required(errorTypeOne)
});

exports.updateCitySchema = yup.object({
    name: yup.string().required(errorTypeOne)
});

exports.deleteCitySchema = yup.object({
    id: yup.string().required('ID is required')
});

// RESTO VALIDATION SCHEMAS
exports.addRestoSchema = yup.object({
    name: yup.string().required('Name is required'),
    OpenDaysTime: yup.string().required('Open Days and Times are required'),
    countryId: yup.string().required('Country is required'),
    cityId: yup.string().required('City is required'),
    image: yup.string().required('Image is required'),
});

exports.updateRestoSchema = yup.object({
    name: yup.string().required('Name is required'),
    OpenDaysTime: yup.string().required('Open Days and Times are required'),
    countryId: yup.string().required('Country is required'),
    cityId: yup.string().required('City is required'),
    image: yup.string().required('Image is required'),
});

exports.deleteRestoSchema = yup.object({
    id: yup.string().required('ID is required')
});

exports.likeRestoSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    restoId: yup.string().required('Resto ID is required'),
});

exports.unLikeRestoSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    restoId: yup.string().required('Resto ID is required'),
});

// HOSTEL VALIDATION SCHEMAS
exports.addHostelSchema = yup.object({
    name: yup.string().required('Name is required'),
    countryId: yup.string().required('Country is required'),
    cityId: yup.string().required('City is required'),
    image: yup.string().required('Image is required'),
});

exports.updateHostelSchema = yup.object({
    name: yup.string().required('Name is required'),
    countryId: yup.string().required('Country is required'),
    cityId: yup.string().required('City is required'),
    image: yup.string().required('Image is required'),
});

exports.deleteHostelSchema = yup.object({
    id: yup.string().required('ID is required')
});

exports.likeHostelSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    restoId: yup.string().required('Hostel ID is required'),
});

exports.unLikeHostelSchema = yup.object({
    userId: yup.string().required('User ID is required'),
    restoId: yup.string().required('Hostel ID is required'),
});