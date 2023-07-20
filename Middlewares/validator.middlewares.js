exports.ValidatorMiddlewares = (schema) => async (req, res, next) => {

  const resource = req.body;

  // console.log(req.body);

  try {
    // throws an error if not valid
    await schema.validate(resource);
    next();

  } catch (e) {
    res.status(400).json({ success: false, msg: e.errors.join(', ') });
  }

};

  