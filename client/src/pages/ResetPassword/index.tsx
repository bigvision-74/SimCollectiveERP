import React, { useState } from 'react';
import { useNavigate, useParams, useLocation, Link } from 'react-router-dom';
import clsx from 'clsx';
import logoUrl from '@/assetsA/images/simVprLogo.png';
import { FormInput } from '@/components/Base/Form';
import Button from '@/components/Base/Button';
import Alert from '@/components/Base/Alert';
import Lucide from '@/components/Base/Lucide';
import { resetPasswordAction } from '@/actions/userActions';
import { useTranslation } from 'react-i18next';

function ResetPassword() {
  const { t } = useTranslation();

  const [passwordVisible, setPasswordVisible] = useState(false);
  const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  const passwordErrors: string[] = [];
  const useQuery = () => {
    const { search } = useLocation();
    return new URLSearchParams(search);
  };

  const query = useQuery();
  const token: string = query.get('token') ?? 'defaultToken';
  const type = query.get('type');

  const [formData, setFormData] = useState({
    password: '',
    confirmPassword: '',
  });

  const [formErrors, setFormErrors] = useState({
    password: '',
    confirmPassword: '',
    api: '',
  });

  const navigate = useNavigate();

  const validateForm = (): boolean => {
    const errors: Partial<typeof formErrors> = {};

    const passwordErrors = [];

    if (!formData.password) {
      errors.password = ' Password is required.';
    }
    if (formData.password.length < 8) {
      passwordErrors.push('8 characters');
    }
    if (!/(?=.*[a-z])/.test(formData.password)) {
      passwordErrors.push('one lowercase letter');
    }
    if (!/(?=.*[A-Z])/.test(formData.password)) {
      passwordErrors.push('one uppercase letter');
    }
    if (!/(?=.*\d)/.test(formData.password)) {
      passwordErrors.push('one digit');
    }
    if (!/(?=.*[@$!%*?&])/.test(formData.password)) {
      passwordErrors.push('one special character');
    }

    if (passwordErrors.length > 0) {
      errors.password = `Password must contain: ${passwordErrors.join(', ')}`;
    }

    if (!formData.confirmPassword) {
      errors.confirmPassword = 'Confirm Password is required.';
    } else if (formData.password !== formData.confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const { name, value } = e.target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === 'password') {
      if (value.length < 8) {
        passwordErrors.push('8 characters');
      }
      if (!/(?=.*[a-z])/.test(value)) {
        passwordErrors.push('one lowercase letter');
      }
      if (!/(?=.*[A-Z])/.test(value)) {
        passwordErrors.push('one uppercase letter');
      }
      if (!/(?=.*\d)/.test(value)) {
        passwordErrors.push('one digit');
      }
      if (!/(?=.*[@$!%*?&])/.test(value)) {
        passwordErrors.push('one special character');
      }

      setFormErrors((prev) => ({
        ...prev,
        password:
          passwordErrors.length > 0
            ? `Password must contain: ${passwordErrors.join(', ')}`
            : '',
      }));
    } else if (name === 'confirmPassword') {
      setFormErrors((prev) => ({
        ...prev,
        confirmPassword:
          value !== formData.password ? 'Passwords do not match.' : '',
      }));
    }
  };

  const togglePasswordVisibility = () => {
    setPasswordVisible((prev) => !prev);
  };
  const toggleconfirmPasswordVisibility = () => {
    setConfirmPasswordVisible((prev) => !prev);
  };

  const handleSubmit = async () => {
    setLoading(false);
    if (validateForm()) {
      setLoading(true);
      setFormErrors((prevErrors) => ({
        ...prevErrors,
        api: '',
      }));
      try {
        // const loginUserFirebase = await loginUser(email, formData.password);

        // if (loginUserFirebase) {
        const formDataToSend = new FormData();
        formDataToSend.append('password', formData.password);
        formDataToSend.append('token', token);
        formDataToSend.append('type', type || '');

        const resetPassword = await resetPasswordAction(formDataToSend);

        if (resetPassword) {
          localStorage.setItem('reset', 'Password Reset');
          navigate('/login');
        } else {
          setFormErrors((prevErrors) => ({
            ...prevErrors,
            api:
              resetPassword.message ||
              'Reset password failed. Please try again.',
          }));
        }
      } catch (error: any) {
        setFormErrors((prevErrors) => ({
          ...prevErrors,
          api:
            error.response?.data?.message ||
            'An error occurred. Please try again.',
        }));
        console.error('Error:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  return (
    <div
      className={clsx([
        'p-3 sm:px-8 relative h-screen lg:overflow-hidden xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600',
        "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#0f1f39]/20 before:rounded-[100%] before:dark:bg-darkmode-400 ",
        "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:rounded-[100%] after:dark:bg-darkmode-900 after:bg-black/50  ",
        'loginBg',
      ])}
    >
      <div className='container relative z-10 sm:px-10'>
        <div className='block grid-cols-2 gap-4 xl:grid'>
          <div className='flex-col hidden min-h-screen xl:flex'>
            <div className='pt-5 -intro-x'>
              <Link to='/' className='inline-block'>
                <img
                  alt='Midone Tailwind HTML Admin Template'
                  className='w-100 sm:w-10 md:w-12 lg:w-16 xl:w-80 block visible XrLogoLogin'
                  src={logoUrl}
                />
              </Link>
            </div>
            <div className='my-auto'>
              <div className='-mt-20 text-4xl font-bold leading-tight text-white -intro-x max-w-xl xl:max-w-lg'>
                <span>{t('Empower')}</span>
                <p className='mt-2'>{t('streamlined')}</p>
              </div>
            </div>
          </div>
          <div className='flex items-center justify-center min-h-screen py-5 xl:h-auto xl:py-0'>
            <div
              className='w-[600px] h-[450px] px-5 py-8 rounded-md shadow-md xl:ml-20 xl:p-14 
                 bg-[#0200007e] dark:bg-darkmode-600 sm:px-8 xl:shadow-none overflow-hidden'
            >
              {formErrors.api && (
                <Alert variant='soft-danger' className='flex items-center mb-2'>
                  <Lucide icon='AlertTriangle' className='w-6 h-6 mr-2' />{' '}
                  {formErrors.api}
                </Alert>
              )}
              <h2 className='text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left text-white'>
                {type === 'set' ? t('SetPassword') : t('ResetPassword')}
              </h2>
              <div className='mt-8 intro-x'>
                <div className='relative mt-4 w-full xl:w-[350px]'>
                  <FormInput
                    type={passwordVisible ? 'text' : 'password'}
                    className='block px-4 py-3 pr-10 w-full mb-2'
                    name='password'
                    placeholder={t('EnterPassword')}
                    value={formData.password.trim()}
                    onChange={handleInputChange}
                    aria-describedby='password-error'
                    style={{ zIndex: 1 }}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                    style={{ zIndex: 2 }}
                    onClick={togglePasswordVisibility}
                  >
                    <Lucide
                      icon={passwordVisible ? 'Eye' : 'EyeOff'}
                      className='w-4 h-4 '
                    />
                  </button>
                </div>
                <div className='min-h-[1.5rem]'>
                  {formErrors.password && (
                    <span id='password-error' className='text-red-500 mt-1'>
                      {formErrors.password}
                    </span>
                  )}
                </div>
                <div className='relative mt-4 w-full xl:w-[350px]'>
                  <FormInput
                    type={confirmPasswordVisible ? 'text' : 'password'}
                    className='block px-4 py-3 pr-10 w-full mb-2'
                    name='confirmPassword'
                    placeholder={t('ConfirmNewPassword')}
                    value={formData.confirmPassword.trim()}
                    onChange={handleInputChange}
                    aria-describedby='confirm-password-error'
                    style={{ zIndex: 1 }}
                  />
                  <button
                    type='button'
                    className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
                    style={{ zIndex: 2 }}
                    onClick={toggleconfirmPasswordVisibility}
                  >
                    <Lucide
                      icon={confirmPasswordVisible ? 'Eye' : 'EyeOff'}
                      className='w-4 h-4 '
                    />
                  </button>
                </div>
              </div>
              <div className='min-h-[1.5rem]'>
                {formErrors.confirmPassword && (
                  <span
                    id='confirm-password-error'
                    className='text-red-500 mt-1'
                  >
                    {formErrors.confirmPassword}
                  </span>
                )}
              </div>
              <div className='mt-5 text-center intro-x xl:mt-8 xl:text-left'>
                <Button
                  variant='primary'
                  className='w-full px-4 py-3 align-top xl:w-32 xl:mr-3'
                  onClick={handleSubmit}
                  disabled={loading}
                >
                  {loading ? (
                    <div className='loader'>
                      <div className='dot'></div>
                      <div className='dot'></div>
                      <div className='dot'></div>
                    </div>
                  ) : (
                    t('save')
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default ResetPassword;
