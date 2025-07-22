import React, { Fragment, useState } from "react";
import fakerData from "@/utils/faker";
import { FormInput } from "@/components/Base/Form";
import { Transition } from "@headlessui/react";
import Lucide from "@/components/Base/Lucide";
import _ from "lodash";

function index() {
  const [searchDropdown, setSearchDropdown] = useState(false);
  const showSearchDropdown = () => {
    setSearchDropdown(true);
  };
  const hideSearchDropdown = () => {
    setSearchDropdown(false);
  };
  return (
    <div className="relative mr-3 intro-x sm:mr-6">
      <div className="hidden sm:block">
        <FormInput
          type="text"
          className="border-transparent w-56 shadow-none rounded-full bg-slate-200 pr-8 transition-[width] duration-300 ease-in-out focus:border-transparent focus:w-72 dark:bg-darkmode-400/70"
          placeholder="Search..."
          onFocus={showSearchDropdown}
          onBlur={hideSearchDropdown}
        />
        <Lucide
          icon="Search"
          className="absolute inset-y-0 right-0 w-5 h-5 my-auto mr-3 text-slate-600 dark:text-slate-500"
        />
      </div>
      <a className="relative text-white/70 sm:hidden" href="">
        <Lucide icon="Search" className="w-5 h-5 dark:text-slate-500" />
      </a>
      <Transition
        as={Fragment}
        show={searchDropdown}
        enter="transition-all ease-linear duration-150"
        enterFrom="mt-5 invisible opacity-0 translate-y-1"
        enterTo="mt-[3px] visible opacity-100 translate-y-0"
        leave="transition-all ease-linear duration-150"
        leaveFrom="mt-[3px] visible opacity-100 translate-y-0"
        leaveTo="mt-5 invisible opacity-0 translate-y-1"
      >
        <div className="absolute right-0 z-10 mt-[3px]">
          <div className="w-[450px] p-5 box">
            <div className="mb-2 font-medium">Pages</div>
            <div className="mb-5">
              <a href="" className="flex items-center">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-success/20 dark:bg-success/10 text-success">
                  <Lucide icon="Inbox" className="w-4 h-4" />
                </div>
                <div className="ml-3">Mail Settings</div>
              </a>
              <a href="" className="flex items-center mt-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-pending/10 text-pending">
                  <Lucide icon="Users" className="w-4 h-4" />
                </div>
                <div className="ml-3">Users & Permissions</div>
              </a>
              <a href="" className="flex items-center mt-2">
                <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 dark:bg-primary/20 text-primary/80">
                  <Lucide icon="CreditCard" className="w-4 h-4" />
                </div>
                <div className="ml-3">Transactions Report</div>
              </a>
            </div>
            <div className="mb-2 font-medium">Users</div>
            <div className="mb-5">
              {_.take(fakerData, 4).map((faker, fakerKey) => (
                <a key={fakerKey} href="" className="flex items-center mt-2">
                  <div className="w-8 h-8 image-fit">
                    <img
                      alt="Midone Tailwind HTML Admin Template"
                      className="rounded-full"
                      src={faker.photos[0]}
                    />
                  </div>
                  <div className="ml-3">{faker.users[0].name}</div>
                  <div className="w-48 ml-auto text-xs text-right truncate text-slate-500">
                    {faker.users[0].email}
                  </div>
                </a>
              ))}
            </div>
            <div className="mb-2 font-medium">Products</div>
            {_.take(fakerData, 4).map((faker, fakerKey) => (
              <a key={fakerKey} href="" className="flex items-center mt-2">
                <div className="w-8 h-8 image-fit">
                  <img
                    alt="Midone Tailwind HTML Admin Template"
                    className="rounded-full"
                    src={faker.images[0]}
                  />
                </div>
                <div className="ml-3">{faker.products[0].name}</div>
                <div className="w-48 ml-auto text-xs text-right truncate text-slate-500">
                  {faker.products[0].category}
                </div>
              </a>
            ))}
          </div>
        </div>
      </Transition>
    </div>
  );
}

export default index;
