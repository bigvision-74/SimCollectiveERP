// import React, { useState } from 'react';
// import { FormInput } from '@/components/Base/Form';
// import Button from '@/components/Base/Button';
// import { resetProfilePasswordAction } from '@/actions/adminActions';
// import { t } from 'i18next';
// import Lucide from '@/components/Base/Lucide';

// interface ComponentProps {
//   onAction: (message: string, variant: 'success' | 'danger') => void;
// }
// interface PasswordStrength {
//   hasCapital: boolean;
//   hasSpecial: boolean;
//   hasMinLength: boolean;
//   hasSpace: boolean;
// }
// interface PasswordErrors {
//   current: string;
//   new: string;
//   confirm: string;
// }
// const main: React.FC<ComponentProps> = ({ onAction }) => {
//   const [currentPassword, setCurrentPassword] = useState('');

//   const [newPassword, setNewPassword] = useState('');
//   const [confirmPassword, setConfirmPassword] = useState('');
//   const [passwordVisible, setPasswordVisible] = useState(false);
//   const [confirmPasswordVisible, setConfirmPasswordVisible] = useState(false);
//   const [loading, setLoading] = useState(false);

//   const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
//     hasCapital: false,
//     hasSpecial: false,
//     hasMinLength: false,
//     hasSpace: false,
//   });
//   const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
//     current: '',
//     new: '',
//     confirm: '',
//   });
//   const user = localStorage.getItem('user');

//   const checkPasswordStrength = (password: string): void => {
//     const hasSpace = /\s/.test(password);
//     const hasCapital = /[A-Z]/.test(password);
//     const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
//     const hasMinLength = password.length >= 8;

//     setPasswordStrength({
//       hasCapital,
//       hasSpecial,
//       hasMinLength,
//       hasSpace,
//     });

//     setNewPassword(password);
//     if (hasSpace) {
//       setPasswordErrors((prev) => ({
//         ...prev,
//         new: t('passwordSpace'),
//       }));
//       return;
//     }

//     if (password && hasCapital && hasSpecial && hasMinLength) {
//       setPasswordErrors((prev) => ({
//         ...prev,
//         new: '',
//       }));
//     }

//     if (confirmPassword && password === confirmPassword) {
//       setPasswordErrors((prev) => ({
//         ...prev,
//         confirm: '',
//       }));
//     }
//   };

//   // const togglePasswordVisibility = () => {
//   //   setPasswordVisible((prev) => !prev);
//   // };
//   // const toggleconfirmPasswordVisibility = () => {
//   //   setConfirmPasswordVisible((prev) => !prev);
//   // };

//   const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
//     setPasswordVisible((prev) => ({
//       ...prev,
//       [field]: !prev[field],
//     }));
//   };

//   const validateForm = (): Partial<PasswordErrors> => {
//     const errors: PasswordErrors = {
//       current: '',
//       new: '',
//       confirm: '',
//     };
//     if (!currentPassword) {
//       errors.current = t('currentPasswordRequired');
//     }

//     const hasCapital = /[A-Z]/.test(newPassword);
//     const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
//     const hasMinLength = newPassword.length >= 8;
//     const hasSpace = /\s/.test(newPassword);

//     if (!newPassword) {
//       errors.new = t('newPassword');
//     } else if (hasSpace) {
//       errors.new = t('passwordSpace');
//     } else if (!hasCapital || !hasSpecial || !hasMinLength) {
//       let errorMsg = t('passwordContain');
//       if (!hasMinLength) errorMsg += t('eightChar');
//       if (!hasCapital) errorMsg += (!hasMinLength ? ', ' : '') + t('oneCap');
//       if (!hasSpecial)
//         errorMsg +=
//           (!hasMinLength || !hasCapital ? ', ' : '') + t('oneSpecial');
//       errors.new = errorMsg;
//     }

//     if (!confirmPassword) {
//       errors.confirm = t('confirmPass');
//     } else if (/\s/.test(confirmPassword)) {
//       errors.confirm = t('confirmSpace');
//     } else if (newPassword && newPassword !== confirmPassword) {
//       errors.confirm = t('Passwordsdonotmatch');
//     }

//     setPasswordErrors(errors);
//     return errors;
//   };

//   // const handleSubmit = async () => {
//   //   const errors = validateForm();

//   //   if (Object.values(errors).some(Boolean)) return;

//   //   setLoading(true);

//   //   try {
//   //     const formDataToSend = new FormData();

//   //     formDataToSend.append('newPassword', newPassword);
//   //     if (user) {
//   //       formDataToSend.append('username', user);
//   //     }

//   //     const response = await resetProfilePasswordAction(formDataToSend);
//   //     setLoading(false);

//   //     if (response) {
//   //       window.scrollTo({ top: 0, behavior: 'smooth' });

//   //       onAction(t('Passwordchangedsuccessfully'), 'success');
//   //       setNewPassword('');
//   //       setConfirmPassword('');
//   //     }
//   //   } catch (error: any) {
//   //     setLoading(false);
//   //     window.scrollTo({ top: 0, behavior: 'smooth' });

//   //     onAction(t('Anerroroccurred'), 'danger');
//   //     console.error('Error:', error);
//   //   }
//   // };

//   const handleSubmit = async () => {
//     const errors = validateForm();

//     if (Object.values(errors).some(Boolean)) return;

//     setLoading(true);

//     try {
//       const formDataToSend = new FormData();
//       formDataToSend.append('currentPassword', currentPassword);
//       formDataToSend.append('newPassword', newPassword);
//       if (user) {
//         formDataToSend.append('username', user);
//       }

//       const response = await resetProfilePasswordAction(formDataToSend);
//       setLoading(false);

//       if (response) {
//         window.scrollTo({ top: 0, behavior: 'smooth' });
//         onAction(t('Passwordchangedsuccessfully'), 'success');
//         setCurrentPassword('');
//         setNewPassword('');
//         setConfirmPassword('');
//       }
//     } catch (error: any) {
//       setLoading(false);
//       window.scrollTo({ top: 0, behavior: 'smooth' });

//       const errorMessage =
//         error.response?.data?.message || t('Anerroroccurred');
//       onAction(errorMessage, 'danger');
//       console.error('Error:', error);
//     }
//   };

//   const handleConfirmPasswordChange = (
//     e: React.ChangeEvent<HTMLInputElement>
//   ): void => {
//     const value = e.target.value;
//     setConfirmPassword(value);

//     if (newPassword && value === newPassword) {
//       setPasswordErrors((prev) => ({
//         ...prev,
//         confirm: '',
//       }));
//     }
//   };

//   return (
//     <div className='grid grid-cols-12 gap-6 mt-5 intro-y'>
//       <div className='col-span-12 intro-y md:col-span-12 xl:col-span-12 box'>
//         <div className='flex px-5 py-4 border-b border-slate-200/60 dark:border-darkmode-400'>
//           <div className='ml-3 mr-auto content-center'>
//             <a className='font-medium'>{t('change_Password')}</a>
//           </div>
//         </div>

//         <div className='px-8 mt-6'>
//           <div className='relative w-full xl:w-[450px]'>
//             <FormInput
//               type={passwordVisible.current ? 'text' : 'password'}
//               className='block px-4 py-3 pr-10 w-full mb-2'
//               name='currentPassword'
//               placeholder={t('Current_password')}
//               value={currentPassword}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                 setCurrentPassword(e.target.value.trim());
//               }}
//               aria-describedby='current-password-error'
//               style={{ zIndex: 1 }}
//             />
//             <button
//               type='button'
//               className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
//               style={{ zIndex: 2 }}
//               onClick={() => togglePasswordVisibility('current')}
//             >
//               <Lucide
//                 icon={passwordVisible.current ? 'Eye' : 'EyeOff'}
//                 className='w-4 h-4 '
//               />
//             </button>
//           </div>
//         </div>
//         {passwordErrors.current && (
//           <p className='text-red-500 px-8 text-sm'>{passwordErrors.current}</p>
//         )}

//         <div className='px-8'>
//           <div className='relative mt-6  w-full xl:w-[450px]'>
//             <FormInput
//               type={passwordVisible.new ? 'text' : 'password'}
//               className='block px-4 py-3 pr-10 w-full mb-2'
//               name='password'
//               placeholder={t('New_password')}
//               value={newPassword}
//               onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
//                 checkPasswordStrength(e.target.value.trim());
//               }}
//               aria-describedby='password-error'
//               style={{ zIndex: 1 }}
//             />
//             <button
//               type='button'
//               className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
//               style={{ zIndex: 2 }}
//               onClick={() => togglePasswordVisibility('new')}
//             >
//               <Lucide
//                 icon={passwordVisible.new ? 'Eye' : 'EyeOff'}
//                 className='w-4 h-4 '
//               />
//             </button>
//           </div>
//         </div>
//         {passwordErrors.new && (
//           <p className='text-red-500 px-8 text-sm'>{passwordErrors.new}</p>
//         )}
//         <div className='px-8 text-sm mb-3'>
//           <p className='mb-1'>{t('passwordContain')}</p>
//           <ul className='pl-4'>
//             <li
//               className={
//                 passwordStrength.hasMinLength
//                   ? 'text-green-500'
//                   : 'text-gray-500'
//               }
//             >
//               <span
//                 className={passwordStrength.hasMinLength ? 'font-bold' : ''}
//               >
//                 {passwordStrength.hasMinLength ? '✓' : '•'} {t('eightChar')}
//               </span>
//             </li>
//             <li
//               className={
//                 passwordStrength.hasCapital ? 'text-green-500' : 'text-gray-500'
//               }
//             >
//               <span className={passwordStrength.hasCapital ? 'font-bold' : ''}>
//                 {passwordStrength.hasCapital ? '✓' : '•'} {t('oneCap')}
//               </span>
//             </li>
//             <li
//               className={
//                 passwordStrength.hasSpecial ? 'text-green-500' : 'text-gray-500'
//               }
//             >
//               <span className={passwordStrength.hasSpecial ? 'font-bold' : ''}>
//                 {passwordStrength.hasSpecial ? '✓' : '•'} {t('oneSpecial')}
//               </span>
//             </li>
//           </ul>
//         </div>
//         <div className='px-8'>
//           <div className='relative w-full xl:w-[450px]'>
//             <FormInput
//               type={confirmPasswordVisible.confirm ? 'text' : 'password'}
//               className='block px-4 py-3 pr-10 w-full mb-2'
//               name='confirmPassword'
//               placeholder={t('Confirm_new_password')}
//               value={confirmPassword.trim()}
//               onChange={handleConfirmPasswordChange}
//               aria-describedby='confirm-password-error'
//               style={{ zIndex: 1 }}
//             />
//             <button
//               type='button'
//               className='absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500'
//               style={{ zIndex: 2 }}
//               // onClick={toggleconfirmPasswordVisibility}
//               onClick={() => togglePasswordVisibility('confirm')}
//             >
//               <Lucide
//                 icon={confirmPasswordVisible.confirm ? 'Eye' : 'EyeOff'}
//                 className='w-4 h-4 '
//               />
//             </button>
//           </div>
//         </div>
//         {passwordErrors.confirm && (
//           <p className='text-red-500 px-8 text-sm'>{passwordErrors.confirm}</p>
//         )}
//         <div className='mt-8 px-8 mb-5'>
//           <Button
//             type='button'
//             variant='primary'
//             className='w-24'
//             onClick={handleSubmit}
//             disabled={loading}
//           >
//             {loading ? (
//               <div className='loader'>
//                 <div className='dot'></div>
//                 <div className='dot'></div>
//                 <div className='dot'></div>
//               </div>
//             ) : (
//               t('save')
//             )}
//           </Button>
//         </div>
//       </div>
//     </div>
//   );
// };

// export default main;

import React, { useState } from "react";
import { FormInput } from "@/components/Base/Form";
import Button from "@/components/Base/Button";
import { resetProfilePasswordAction } from "@/actions/adminActions";
import { t } from "i18next";
import Lucide from "@/components/Base/Lucide";

interface ComponentProps {
  onAction: (message: string, variant: "success" | "danger") => void;
}
interface PasswordStrength {
  hasCapital: boolean;
  hasSpecial: boolean;
  hasMinLength: boolean;
  hasSpace: boolean;
}
interface PasswordErrors {
  current: string;
  new: string;
  confirm: string;
}
const main: React.FC<ComponentProps> = ({ onAction }) => {
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [passwordVisible, setPasswordVisible] = useState({
    current: false,
    new: false,
    confirm: false,
  });
  const [loading, setLoading] = useState(false);

  const [passwordStrength, setPasswordStrength] = useState<PasswordStrength>({
    hasCapital: false,
    hasSpecial: false,
    hasMinLength: false,
    hasSpace: false,
  });
  const [passwordErrors, setPasswordErrors] = useState<PasswordErrors>({
    current: "",
    new: "",
    confirm: "",
  });
  const user = localStorage.getItem("user");

  const checkPasswordStrength = (password: string): void => {
    const hasSpace = /\s/.test(password);
    const hasCapital = /[A-Z]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    const hasMinLength = password.length >= 8;

    setPasswordStrength({
      hasCapital,
      hasSpecial,
      hasMinLength,
      hasSpace,
    });

    setNewPassword(password);
    if (hasSpace) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: t("passwordSpace"),
      }));
      return;
    }

    if (password && hasCapital && hasSpecial && hasMinLength) {
      setPasswordErrors((prev) => ({
        ...prev,
        new: "",
      }));
    }

    if (confirmPassword && password === confirmPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "",
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof typeof passwordVisible) => {
    setPasswordVisible((prev) => ({
      ...prev,
      [field]: !prev[field],
    }));
  };

  const validateForm = (): Partial<PasswordErrors> => {
    const errors: PasswordErrors = {
      current: "",
      new: "",
      confirm: "",
    };

    if (!currentPassword) {
      errors.current = t("currentPasswordRequired");
    }

    const hasCapital = /[A-Z]/.test(newPassword);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(newPassword);
    const hasMinLength = newPassword.length >= 8;
    const hasSpace = /\s/.test(newPassword);

    if (!newPassword) {
      errors.new = t("newPassword");
    } else if (hasSpace) {
      errors.new = t("passwordSpace");
    } else if (!hasCapital || !hasSpecial || !hasMinLength) {
      let errorMsg = t("passwordContain");
      if (!hasMinLength) errorMsg += t("eightChar");
      if (!hasCapital) errorMsg += (!hasMinLength ? ", " : "") + t("oneCap");
      if (!hasSpecial)
        errorMsg +=
          (!hasMinLength || !hasCapital ? ", " : "") + t("oneSpecial");
      errors.new = errorMsg;
    }

    if (!confirmPassword) {
      errors.confirm = t("confirmPass");
    } else if (/\s/.test(confirmPassword)) {
      errors.confirm = t("confirmSpace");
    } else if (newPassword && newPassword !== confirmPassword) {
      errors.confirm = t("Passwordsdonotmatch");
    }

    setPasswordErrors(errors);
    return errors;
  };
  // handle submit

  const handleSubmit = async () => {
    const errors = validateForm();
    if (Object.values(errors).some(Boolean)) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("username", user || "");
      formData.append("currentPassword", currentPassword);
      formData.append("newPassword", newPassword);

      await resetProfilePasswordAction(formData);

      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");

      onAction(t("Passwordchangedsuccessfully"), "success");
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.message ||
        error.message ||
        t("Failedchangepassword");
      onAction(errorMessage, "danger");
    } finally {
      setLoading(false);
      window.scrollTo({ top: 0, behavior: "smooth" });
    }
  };

  const handleConfirmPasswordChange = (
    e: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const value = e.target.value;
    setConfirmPassword(value);

    if (newPassword && value === newPassword) {
      setPasswordErrors((prev) => ({
        ...prev,
        confirm: "",
      }));
    }
  };

  return (
    <div className="grid grid-cols-12 gap-6 mt-5 intro-y">
      <div className="col-span-12 intro-y md:col-span-12 xl:col-span-12 box">
        <div className="flex px-5 py-4 border-b border-slate-200/60 dark:border-darkmode-400">
          <div className="ml-3 mr-auto content-center">
            <a className="font-medium">{t("change_Password")}</a>
          </div>
        </div>

        <div className="px-8 mt-6">
          <div className="relative w-full xl:w-[450px]">
            <FormInput
              type={passwordVisible.current ? "text" : "password"}
              className="block px-4 py-3 pr-10 w-full mb-2"
              name="currentPassword"
              placeholder={t("Current_password")}
              value={currentPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setCurrentPassword(e.target.value.trim());
              }}
              aria-describedby="current-password-error"
              style={{ zIndex: 1 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              style={{ zIndex: 2 }}
              onClick={() => togglePasswordVisibility("current")}
            >
              <Lucide
                icon={passwordVisible.current ? "Eye" : "EyeOff"}
                className="w-4 h-4 "
              />
            </button>
          </div>
        </div>
        {passwordErrors.current && (
          <p className="text-red-500 px-8 text-sm">{passwordErrors.current}</p>
        )}

        <div className="px-8">
          <div className="relative mt-6 w-full xl:w-[450px]">
            <FormInput
              type={passwordVisible.new ? "text" : "password"}
              className="block px-4 py-3 pr-10 w-full mb-2"
              name="password"
              placeholder={t("New_password")}
              value={newPassword}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                checkPasswordStrength(e.target.value.trim());
              }}
              aria-describedby="password-error"
              style={{ zIndex: 1 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              style={{ zIndex: 2 }}
              onClick={() => togglePasswordVisibility("new")}
            >
              <Lucide
                icon={passwordVisible.new ? "Eye" : "EyeOff"}
                className="w-4 h-4 "
              />
            </button>
          </div>
        </div>
        {passwordErrors.new && (
          <p className="text-red-500 px-8 text-sm">{passwordErrors.new}</p>
        )}
        <div className="px-8 text-sm mb-3">
          <p className="mb-1">{t("passwordContain")}</p>
          <ul className="pl-4">
            <li
              className={
                passwordStrength.hasMinLength
                  ? "text-green-500"
                  : "text-gray-500"
              }
            >
              <span
                className={passwordStrength.hasMinLength ? "font-bold" : ""}
              >
                {passwordStrength.hasMinLength ? "✓" : "•"} {t("eightChar")}
              </span>
            </li>
            <li
              className={
                passwordStrength.hasCapital ? "text-green-500" : "text-gray-500"
              }
            >
              <span className={passwordStrength.hasCapital ? "font-bold" : ""}>
                {passwordStrength.hasCapital ? "✓" : "•"} {t("oneCap")}
              </span>
            </li>
            <li
              className={
                passwordStrength.hasSpecial ? "text-green-500" : "text-gray-500"
              }
            >
              <span className={passwordStrength.hasSpecial ? "font-bold" : ""}>
                {passwordStrength.hasSpecial ? "✓" : "•"} {t("oneSpecial")}
              </span>
            </li>
          </ul>
        </div>
        <div className="px-8">
          <div className="relative w-full xl:w-[450px]">
            <FormInput
              type={passwordVisible.confirm ? "text" : "password"}
              className="block px-4 py-3 pr-10 w-full mb-2"
              name="confirmPassword"
              placeholder={t("Confirm_new_password")}
              value={confirmPassword.trim()}
              onChange={handleConfirmPasswordChange}
              aria-describedby="confirm-password-error"
              style={{ zIndex: 1 }}
            />
            <button
              type="button"
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500"
              style={{ zIndex: 2 }}
              onClick={() => togglePasswordVisibility("confirm")}
            >
              <Lucide
                icon={passwordVisible.confirm ? "Eye" : "EyeOff"}
                className="w-4 h-4"
              />
            </button>
          </div>
        </div>
        {passwordErrors.confirm && (
          <p className="text-red-500 px-8 text-sm">{passwordErrors.confirm}</p>
        )}
        <div className="mt-8 px-8 mb-5">
          <Button
            type="button"
            variant="primary"
            className="w-24"
            onClick={handleSubmit}
            disabled={loading}
          >
            {loading ? (
              <div className="loader">
                <div className="dot"></div>
                <div className="dot"></div>
                <div className="dot"></div>
              </div>
            ) : (
              t("save")
            )}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default main;
