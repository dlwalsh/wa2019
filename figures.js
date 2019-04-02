const enrolment = require('./enrolment');

enrolment((err, figures) => {
  console.log(JSON.stringify(figures, null, 4));
});
