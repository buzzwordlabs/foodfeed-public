import React, { useState } from 'react';
import { Emoji, LoadingSubmit } from '../../components';
import css from './Contact.module.css';
import ReCAPTCHA from 'react-google-recaptcha';
import { toast } from 'react-toastify';
import { Redirect } from 'react-router-dom';
import validator from 'validator';
import { SubmitFormEvent, InputChangeEvent } from '../../@types/types';
import { tintColor, fadedTintColor } from '../../constants';

interface State {
  name: string;
  email: string;
  message: string;
  isVerified: boolean;
  isCompleted: boolean;
  isLoading: boolean;
  redirect: boolean;
}

const initState: State = {
  name: '',
  email: '',
  message: '',
  isVerified: false,
  isCompleted: false,
  isLoading: false,
  redirect: false
};

const Contact = () => {
  const [state, setState] = useState(initState);

  const submit = async (e: SubmitFormEvent) => {
    e.preventDefault();
    setState({ ...state, isLoading: true });
    const { name, email, message } = state;
    if (name === '' || email === '' || message === '') {
      toast.error('Name, email, or message cannot be blank.');
      return setState({ ...state, isLoading: false });
    }
    if (!validator.isEmail(email)) {
      toast.error('Email is invalid. Try again.');
      return setState({ ...state, isLoading: false });
    }
    // If user successfully clicked the Recaptcha, send form data
    if (state.isVerified) {
      const response = await fetch('/contacts/form', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          name,
          email,
          message
        })
      });
      setState({ ...state, isLoading: false });
      if (response.ok) {
        toast.success('Success! Email was sent.');
        setState({ ...state, isCompleted: true });
        setTimeout(() => {
          setState({ ...state, redirect: true });
        }, 3000);
        return;
      } else {
        toast.error('Something went wrong.');
      }
    } else {
      // If the user is not verified yet, raise an error and tell them to click the Recaptcha
      return toast.error(
        'Please verify you are not a robot with the Recaptcha.'
      );
    }
  };

  const handleChange = (e: InputChangeEvent) => {
    // Store the name of the property being changed
    const name = e.target.name;
    // Store the value the property will change to (the current input)
    const value = e.target.value;
    setState({
      ...state,
      // Update only the property that should be changed
      [name]: value
    });
  };

  const verifyCallback = async (recaptchaToken: string) => {
    if (recaptchaToken) {
      const response = await fetch(`/contacts/recaptcha`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ recaptcha: recaptchaToken })
      });
      if (response.ok) return setState({ ...state, isVerified: true });
      else toast.error('Something went wrong.');
    }
  };

  const { isLoading, isVerified, isCompleted, redirect } = state;

  if (redirect) {
    return <Redirect to="/" />;
  }

  return (
    <div className="container" style={{ minHeight: '85vh' }}>
      <div className="row">
        <div className="col-md-6 offset-md-3 col-12">
          <h1 className="text-center">
            Contact Us
            <Emoji value="📧" ariaLabel="Email Emoji" />
          </h1>
          <h5 className="text-center">Message us for anything!</h5>
          <br />
          <h5 className="text-center mb-5">
            Questions, feedback, and random messages are welcome.
          </h5>
          {isCompleted ? (
            <h1 style={{ marginBottom: '20rem' }}>Your message was sent!</h1>
          ) : (
            <form onSubmit={submit} id="contactForm" className={css.form}>
              <label />
              <input
                type="text"
                name="name"
                placeholder="Name"
                form="contactForm"
                minLength={1}
                title="Minimum length is 1"
                className={css.textField}
                onChange={handleChange}
                required
              />
              <label />
              <input
                type="email"
                name="email"
                placeholder="you@gmail.com"
                title="Ex: you@gmail.com"
                form="contactForm"
                minLength={1}
                className={css.textField}
                onChange={handleChange}
                required
              />
              <label />
              <textarea
                name="message"
                placeholder="Your feedback or questions"
                form="contactForm"
                minLength={1}
                title="Minimum length is 1"
                className={css.textAreaField}
                onChange={handleChange as any}
              />
              <ReCAPTCHA
                sitekey={process.env.REACT_APP_RECAPTCHA_SITE_KEY || ''}
                onChange={async (recaptchaToken) =>
                  verifyCallback(recaptchaToken || '')
                }
                theme="dark"
              />
              <LoadingSubmit
                className="btn btn-primary d-block my-4"
                style={{
                  backgroundColor: tintColor,
                  borderColor: fadedTintColor,
                  color: 'white'
                }}
                value="Submit Message"
                loadingValue="Loading..."
                isLoading={isLoading}
                disabled={!isVerified}
              />
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default Contact;
