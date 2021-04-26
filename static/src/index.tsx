import React from 'react';
import ReactDOM from 'react-dom';
// import { createBrowserHistory } from 'history';
import RenderRoutes from './routes/RenderRoutes';
import 'bootstrap/dist/css/bootstrap.min.css';
import 'bootstrap/dist/js/bootstrap.bundle.min';
import './global/global.css';
import 'react-toastify/dist/ReactToastify.css';
import ReactGA from 'react-ga';
// import { hotjar } from 'react-hotjar';

// toast.configure({ hideProgressBar: true });
// if (process.env.NODE_ENV === 'production') {
//   hotjar.initialize(1324905, 6);
// }
// // const hist = createBrowserHistory();
ReactGA.initialize(process.env.REACT_APP_GOOGLE_ANALYTICS_ID!);
ReactGA.pageview(window.location.pathname + window.location.search);
function App() {
  return <RenderRoutes />;
}

ReactDOM.render(<App />, document.getElementById('root'));
