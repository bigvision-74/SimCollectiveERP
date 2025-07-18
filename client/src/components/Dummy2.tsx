// import React from "react";
// import { useTranslation } from "react-i18next";
// import Slider from "react-slick";

// const Testimonials = () => {
//   const { t } = useTranslation();

//   const testimonials = [
//     {
//       name: t("Dr. Sarah Johnson"),
//       role: t("Medical Educator"),
//       quote: t(
//         "This platform has transformed how we train our students. The realistic cases are unparalleled."
//       ),
//       avatar: "/path/to/avatar1.jpg",
//     },
//     {
//       name: t("Prof. Michael Chen"),
//       role: t("Program Director"),
//       quote: t(
//         "The analytics dashboard provides invaluable insights into our students' clinical reasoning."
//       ),
//       avatar: "/path/to/avatar2.jpg",
//     },
//     {
//       name: t("Emily Rodriguez"),
//       role: t("Medical Student"),
//       quote: t(
//         "Practicing with virtual patients gave me the confidence I needed for clinical rotations."
//       ),
//       avatar: "/path/to/avatar3.jpg",
//     },
//   ];

//   const settings = {
//     dots: true,
//     infinite: true,
//     speed: 500,
//     slidesToShow: 1,
//     slidesToScroll: 1,
//     autoplay: true,
//     autoplaySpeed: 5000,
//   };

//   return (
//     <div className="py-16 px-4 bg-gray-50">
//       <div className="max-w-4xl mx-auto">
//         <h2 className="text-3xl font-bold text-center mb-12 text-gray-800">
//           {t("What Our Users Say")}
//         </h2>
//         <Slider {...settings}>
//           {testimonials.map((testimonial, index) => (
//             <div key={index} className="px-4">
//               <div className="bg-white p-8 rounded-lg shadow-sm text-center">
//                 <div className="w-20 h-20 mx-auto mb-4 rounded-full bg-gray-200 overflow-hidden">
//                   {/* Replace with actual image */}
//                   <div className="w-full h-full flex items-center justify-center text-gray-400">
//                     <span className="text-2xl">👤</span>
//                   </div>
//                 </div>
//                 <p className="text-gray-600 italic mb-6">
//                   "{testimonial.quote}"
//                 </p>
//                 <h4 className="font-bold text-gray-800">{testimonial.name}</h4>
//                 <p className="text-gray-500 text-sm">{testimonial.role}</p>
//               </div>
//             </div>
//           ))}
//         </Slider>
//       </div>
//     </div>
//   );
// };

// export default Testimonials;
