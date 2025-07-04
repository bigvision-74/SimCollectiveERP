import React, { useState, useEffect } from 'react';
import ThemeSwitcher from '@/components/ThemeSwitcher';
import logoUrl from '@/assetsA/images/Final-logo-InsightXR.png';
import illustrationUrl from '@/assets/images/illustration.svg';
import { FormInput, FormCheck, FormLabel } from '@/components/Base/Form';
import Button from '@/components/Base/Button';
import clsx from 'clsx';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import {
  verifyAction,
  getCodeAction,
  addOnlineUserAction,
  getUserAction,
} from '@/actions/userActions';
import Alert from '@/components/Base/Alert';
import Lucide from '@/components/Base/Lucide';
import { loginUser } from '@/actions/authAction';
import { t } from 'i18next';
import Alerts from '@/components/Alert';

function Main() {
  const navigate = useNavigate();

  const location = useLocation();
  const { data } = location.state || {};

  interface FormData {
    code: string;
  }

  interface FormErrors {
    code?: string;
  }

  const [formData, setFormData] = useState<FormData>({
    code: '',
  });

  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [showAlert, setShowAlert] = useState<{
    variant: 'success' | 'danger';
    message: string;
  } | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [showAlerterror, setShowAlerterror] = useState(false);
  const [loading, setLoading] = useState(false);
  const [loadingotp, setLoadingotp] = useState(false);

  const validateForm = (): boolean => {
    const errors: FormErrors = {};

    if (!formData.code) {
      errors.code = 'Enter OTP';
    } else if (formData.code.length < 6) {
      errors.code = 'Code must be 6 characters';
    }

    setFormErrors(errors);

    return Object.keys(errors).length === 0;
  };

  const handleInputChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    const target = e.target;
    const { name, value } = target;

    setFormData((prev) => ({ ...prev, [name]: value }));

    const errors: Partial<typeof formErrors> = {};
    if (name === 'code') {
      if (!value) {
        errors.code = '';
      } else if (value.length < 6) {
        errors.code = 'Code must be at least 6 characters';
      } else {
        errors.code = '';
      }
    }

    setFormErrors((prevErrors) => ({
      ...prevErrors,
      ...errors,
    }));
  };

  const user = localStorage.getItem('user');

  // useEffect(() => {
  //   if (user === null) {
  //     console.error('User not found in localStorage');
  //     return;
  //   }

  //   const fetchData = async () => {
  //     try {
  //       await getCodeAction(user);
  //       localStorage.setItem('status', 'true');
  //     } catch (error) {
  //       console.error('Error fetching code:', error);
  //     }
  //   };
  //   fetchData();
  // }, [user]);

  const ResendOtp = async () => {
    setLoadingotp(false);

    try {
      setLoadingotp(true);
console.log(user, "user");
      if (user) {
        const resend = await getCodeAction(user);
        localStorage.setItem('status', 'true');

        if (resend) {
          setLoadingotp(false);

          setShowAlert({
            variant: 'success',
            message: t('resent'),
          });

          setTimeout(() => {
            setShowAlert(null);
          }, 3000);
        }
      }
    } catch (error) {
      console.error('Error fetching code:', error);
    }
  };

  const handleSubmit = async () => {
    setLoading(false);
    setShowAlerterror(false);

    if (validateForm()) {
      setLoading(true);

      try {
        if (user === null) {
          console.error('User not found in localStorage');
          return;
        }
// console.log(user, "user");
        const formDataToSend = new FormData();
        formDataToSend.append('code', formData.code);
        formDataToSend.append('email', user);

        const verifiedResponse = await verifyAction(formDataToSend);

        if (verifiedResponse) {
          const loginUserFirebase = await loginUser(data.email, data.password);
          if (loginUserFirebase) {
            const FormDataOnlineUser = new FormData();
            let ipAddress;
            let latitudeData: string | undefined;
            let longitudeData: string | undefined;
            let cityData: string | undefined;

            const getIpAddress = async () => {
              try {
                const response = await fetch(
                  'https://api.ipify.org?format=json'
                );
                const data = await response.json();
                return data.ip;
              } catch (error) {
                console.error('Error fetching IP address:', error);
              }
            };

            const getGeolocationByIp = async (ipAddress: string) => {
              const url = `https://get.geojs.io/v1/ip/geo/${ipAddress}.json`;
              try {
                const response = await fetch(url);
                if (!response.ok) {
                  throw new Error('Network response was not ok');
                }
                const data = await response.json();

                const { latitude, longitude, country_code } = data;
                latitudeData = latitude;
                longitudeData = longitude;
                cityData = country_code;
              } catch (error) {
                console.error('Error fetching geolocation data:', error);
              }
            };

            const role = localStorage.getItem('role');

            if (role != 'superadmin') {
              const submitFormWithLocationData = async () => {
                try {
                  const users = await getUserAction(user);
                  const userId = users.id;
                  ipAddress = await getIpAddress();
                  await getGeolocationByIp(ipAddress);
                  FormDataOnlineUser.append('ipAddress', ipAddress);
                  FormDataOnlineUser.append('latitude', latitudeData || 'null');
                  FormDataOnlineUser.append(
                    'longitude',
                    longitudeData || 'null'
                  );
                  FormDataOnlineUser.append('city', cityData || 'null');
                  FormDataOnlineUser.append('userid', userId);
                  const onlineUser = await addOnlineUserAction(
                    FormDataOnlineUser
                  );
                } catch (error) {
                  console.error('Error submitting form:', error);
                }
              };
              submitFormWithLocationData();
            }

            localStorage.setItem('role', verifiedResponse.data.role);
            localStorage.setItem('successMessage', 'Login successful');

            switch (verifiedResponse.data.role) {
              case 'superadmin':
                navigate('/dashboard');
                break;
              case 'admin':
                navigate('/dashboard-admin');
                break;
              case 'manager':
                navigate('/dashboard-instructor');
                break;
              case 'worker':
                navigate('/dashboard-user');
                break;
              default:
                console.error('Unknown role:', verifiedResponse.data.role);
            }
          }
        } else {
          console.error('Verification failed');
          setShowAlerterror(true);
        }
      } catch (error: any) {
        console.error('Error:', error);
        const errorMessage =
          error.response?.data?.message ||
          'An error occurred during verification';
        setShowAlerterror(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const [ShowEmailSuccessAlert, setShowEmailSuccessAlert] = useState(false);

  useEffect(() => {
    const EmailsuccessMessage = localStorage.getItem('EmailsuccessMessage');
    if (EmailsuccessMessage) {
      setShowEmailSuccessAlert(true);
      localStorage.removeItem('EmailsuccessMessage');
    }
  }, []);

  const handleBackToLogin = () => {
    navigate('/login');
  };

  const handleKeyDown = (e: any) => {
    if (e.key === 'Enter') {
      handleSubmit();
    }
  };
  return (
    <>
      <div
        className={clsx([
          'p-3 sm:px-8 relative h-screen lg:overflow-hidden xl:bg-white dark:bg-darkmode-800 xl:dark:bg-darkmode-600',
          "before:hidden before:xl:block before:content-[''] before:w-[57%] before:-mt-[28%] before:-mb-[16%] before:-ml-[13%] before:absolute before:inset-y-0 before:left-0 before:transform before:rotate-[-4.5deg] before:bg-[#0f1f39]/20 before:rounded-[100%] before:dark:bg-darkmode-400",
          "after:hidden after:xl:block after:content-[''] after:w-[57%] after:-mt-[20%] after:-mb-[13%] after:-ml-[13%] after:absolute after:inset-y-0 after:left-0 after:transform after:rotate-[-4.5deg] after:rounded-[100%] after:dark:bg-darkmode-900 after:bg-black/50 loginBg",
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
                {/* <img
                  alt='Midone Tailwind HTML Admin Template'
                  className='w-1/2 -mt-16 -intro-x'
                  src={illustrationUrl}
                /> */}
                <div className='-mt-20 text-4xl font-bold leading-tight text-white -intro-x max-w-xl xl:max-w-lg'>
                  <span>{t('Empower')}</span>
                  <p className='mt-2'>{t('streamlined')}</p>
                </div>
              </div>
            </div>
            <div className='flex items-center justify-center min-h-screen py-5 xl:h-auto xl:py-0'>
              <div
                className='w-[600px] h-[520px] px-5 py-8 rounded-md shadow-md xl:ml-20 xl:p-14 
                 bg-[#0200007e] dark:bg-darkmode-600 sm:px-8 xl:shadow-none overflow-hidden'
              >
                <Lucide
                  icon='ArrowLeftCircle'
                  className='w-10 h-10 mb-10 leftArrow cursor-pointer text-white'
                  onClick={handleBackToLogin}
                />{' '}
                {showAlerterror && (
                  <Alert
                    variant='soft-danger'
                    className='flex items-center mb-2'
                  >
                    <Lucide icon='AlertTriangle' className='w-6 h-6 mr-2' />{' '}
                    {showAlerterror}
                  </Alert>
                )}
                {ShowEmailSuccessAlert && (
                  <Alert
                    variant='soft-success'
                    className='flex items-center mb-2'
                  >
                    <Lucide icon='CheckSquare' className='w-6 h-6 mr-2' />{' '}
                    {t('Emailsentsuccessfully')}
                  </Alert>
                )}
                {showAlert && <Alerts data={showAlert} />}
                <h2 className='text-2xl font-bold text-center intro-x xl:text-3xl xl:text-left text-white'>
                  {t('Verification')}
                </h2>
                <div className='mt-2 intro-x text-white'>{t('reallyyou')}</div>
                <div className='mt-8 intro-x'>
                  <div className='flex items-center justify-between mt-5'>
                    <FormLabel htmlFor='crud-form-5'>
                      <div className='font-normal text-white'>
                        {t('EnterVerificationCode')}
                      </div>
                    </FormLabel>
                  </div>
                  <FormInput
                    type='text'
                    className='block px-4 py-3 intro-x min-w-full xl:min-w-[350px]'
                    name='code'
                    placeholder={t('EnterVerificationCode')}
                    value={formData.code}
                    onChange={handleInputChange}
                    onKeyDown={(e) => handleKeyDown(e)}
                  />
                </div>
                {formErrors.code && (
                  <p className='text-red-500 text-sm mt-2'>{formErrors.code}</p>
                )}
                <div className='mt-5 text-center intro-x xl:mt-8 xl:text-left   flex flex-col xl:flex-row xl:justify-between'>
                  <Button
                    variant='primary'
                    className='w-full px-4 py-3 align-top xl:w-32 xl:mr-3 mb-3 xl:mb-0'
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
                      t('Verify')
                    )}
                  </Button>

                  <div className='text-white underline cursor-pointer'>
                    <Button
                      variant='soft-secondary'
                      className='w-full px-4 py-3 text-white align-top xl:w-32 xl:mr-3 mb-3 xl:mb-0'
                      onClick={() => {
                        ResendOtp();
                      }}
                    >
                      {loadingotp ? (
                        <div className='loader'>
                          <div className='dot'></div>
                          <div className='dot'></div>
                          <div className='dot'></div>
                        </div>
                      ) : (
                        t('ResendOTP')
                      )}
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

export default Main;
