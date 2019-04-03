import React from 'react';
import { render } from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import App from './components/App';
import Proposal from './components/Proposal';
import SA1Calculator from './components/SA1Calculator';

render(
  <Router history={browserHistory}>
    <Route path="/" component={App} />
    <Route path="/calculator" component={SA1Calculator} />
    <Route path="/proposal" component={Proposal} />
  </Router>,
  document.querySelector('#app'),
);
