import _ from 'lodash';
import clsx from 'clsx';
import { useRef, useState } from 'react';
import fakerData from '@/utils/faker';
import Button from '@/components/Base/Button';
import Pagination from '@/components/Base/Pagination';
import { FormInput, FormSelect } from '@/components/Base/Form';
import TinySlider, { TinySliderElement } from '@/components/Base/TinySlider';
import Lucide from '@/components/Base/Lucide';
import '../style.css';

function Userdashboard() {
  const [salesReportFilter, setSalesReportFilter] = useState<string>();
  const importantNotesRef = useRef<TinySliderElement>();
  const prevImportantNotes = () => {
    importantNotesRef.current?.tns.goTo('prev');
  };
  const nextImportantNotes = () => {
    importantNotesRef.current?.tns.goTo('next');
  };

  return (
    <>
      <div className='grid grid-cols-12 gap-6'>
        <div className='col-span-12 2xl:col-span-9'>
          <div className='grid grid-cols-12 gap-6'>
            {/* BEGIN: General Report */}
            <div className='col-span-12 mt-8'>
              <h1 className='mr-5 text-lg font-medium truncate'>User page</h1>
              <div className='flex items-center h-10 intro-y'>
                <h2 className='mr-5 text-lg font-medium truncate'>
                  General Report
                </h2>
                <a
                  href=''
                  className='flex items-center ml-auto text-primary  whiteColor'
                >
                  <Lucide
                    icon='RefreshCcw'
                    className='w-4 h-4 mr-3 whiteColor'
                  />{' '}
                  Reload Data
                </a>
              </div>
              <div className='grid grid-cols-12 gap-6 mt-5'>
                <div className='col-span-12 sm:col-span-6 xl:col-span-3 intro-y'>
                  <div
                    className={clsx([
                      'relative zoom-in',
                      "before:box before:absolute before:inset-x-3 before:mt-3 before:h-full before:bg-slate-50 before:content-['']",
                    ])}
                  >
                    <div className='p-5 box'>
                      <div className='flex'>
                        <Lucide
                          icon='Users'
                          className='w-[28px] h-[28px] text-primary'
                        />
                        <div className='ml-auto'>
                          {/* <Tippy
                            as='div'
                            className='cursor-pointer bg-success py-[3px] flex rounded-full text-white text-xs pl-2 pr-1 items-center font-medium'
                            content='33% Higher than last month'
                          >
                            33%
                            <Lucide
                              icon='ChevronUp'
                              className='w-4 h-4 ml-0.5'
                            />
                          </Tippy> */}
                        </div>
                      </div>
                      <div className='mt-6 text-3xl font-medium leading-8'>
                        0
                      </div>
                      <div className='mt-1 text-base text-slate-500'>
                        Total courses
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
            {/* BEGIN: Sales Report */}

            {/* END: Sales Report */}
            {/* BEGIN: Weekly Top Seller */}

            {/* END: Schedules */}
          </div>
        </div>
      </div>
    </>
  );
}

export default Userdashboard;
