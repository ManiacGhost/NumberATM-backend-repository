const {  body, check, validationResult } = require("express-validator");

exports.validateTxn = function() {
//  console.log("okk");
     return [ 
        check('buyerFirstName', 'Your email is not valid').not().isEmpty().isEmail(),
        // body('buyerFirstName', 'userName doesnt exists').exists(),
        // body('buyerEmail', 'Invalid email').exists().isEmail(),
        // body('phone').optional().isInt(),
        // body('status').optional().isIn(['enabled', 'disabled'])
       ] ;  
    
  
};
exports.runValidation =  function(req, res, next) {
   
    
    const myValidationResult = validationResult.withDefaults({
      formatter: error => {
        return  error.msg;
        
      },
    });
    const errors = myValidationResult(req).mapped();
    if(Object.entries(errors).length === 0){   
       
      next();
    }
    else {
        console.log(errors);
       
        res.render('txn', { 
            title: 'Express',
            errors: errors,
            fdata: req.body
        });
    }
  // Implement the middleware function based on the options object
  
}