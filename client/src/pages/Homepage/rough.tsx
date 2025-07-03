{
  /* changing here  ////////// /// //////////////////////////changing here  ////////////////////////////////changing here  ///////////// */
}
{
  /* <Dialog
  size='xl'
  open={superlargeModalSizePreview}
  onClose={() => {
    setSuperlargeModalSizePreview(false);
  }}
>
  <Dialog.Panel className='p-10 text-center'>
    This is totally awesome superlarge modal!
  </Dialog.Panel>
</Dialog>; */
}

// old home code

{
  /* <section className='shopsection'>
        <div className='container mx-auto px-4'>
          <div className='flex flex-wrap'>
            <div className='w-full lg:w-1/2'>
              <div className='mt-10 text-left' style={{ marginTop: '10%' }}>
                <div className='text-5xl font-bold projectsection'>
                  <p className='mb-0'>Command Your</p>
                  <p>Fleet of XR Devices</p>
                </div>
                <div className='text-lg mt-4'>
                  Remotely manage{' '}
                  <a href='#' className='font-bold'>
                    AR & VR
                  </a>{' '}
                  devices, deploy content, and control what users can see and do
                  in the headset.
                </div>
              </div>
              <div className='text-lg mt-3'>
                <div className='flex items-center'>
                  <input
                    className='form-input px-4 py-2 me-3 w-1/2'
                    type='email'
                    placeholder='Email Address'
                  />
                  <a
                    className='btn btn-get-started text-xl ml-4  bg-primary text-white py-2 px-3 rounded-lg  hover:bg-blue-600 hover:text-white '
                    href='/home'
                  >
                    Get Started
                  </a>
                </div>
              </div>
            </div>
            <div className='w-full lg:w-1/2 shadow-lg p-3 mb-5 bg-gray-100 rounded'>
              <video autoPlay muted loop className='w-full h-96 object-cover'>
                <source
                  src='/src/assetsA/images/vid/video.mp4'
                  type='video/mp4'
                />
                Your browser does not support the video tag.
              </video>
            </div>
          </div>
        </div>

        <div className='container mx-auto px-4 mt-5'>
          <div className='flex flex-wrap items-start'>
            <div className='w-full lg:w-1/2'>
              <video autoPlay muted loop className='w-full h-96 object-cover'>
                <source
                  src='/src/assetsA/images/vid/Dashborad.mp4'
                  type='video/mp4'
                />
                Your browser does not support the video tag.
              </video>
            </div>
            <div className='w-full lg:w-1/2 text-center'>
              <h2 className='text-3xl font-bold'>Distribute content</h2>
              <ul className='mt-5 space-y-4'>
                <li className='text-lg'>
                  Deploy your library of apps, files, videos, and webXR links
                </li>
                <li>
                  Configure your devices with bundles of XR content, firmware,
                  and settings
                </li>
                <li>Remotely manage content versions and updates</li>
              </ul>
            </div>
          </div>
        </div>
      </section>
      <div className='container mx-auto px-4 mt-5 flex justify-between'>
        <div
          className='w-full lg:w-1/2 bg-cover bg-center rounded-lg flex flex-col mr-4'
          style={{
            backgroundImage: 'url(/src/assetsA/images/111.jpg)',
          }}
        >
          <div className='flex-1 p-6'>
            <h2 className='text-2xl font-semibold mb-2  text-white'>
              Dive into VR with Meta Quest 2
            </h2>
            <p className='text-lg mb-4  text-white'>
              Experience the thrill of immersive games, fitness apps and
              entertainment—now for $50 less.
            </p>
            <div className='flex space-x-2'>
              <a
                href='#'
                className='btn btn-lg custom-btn px-4 py-2 rounded-lg text-white bg-blue-500 hover:bg-blue-600 '
              >
                Add to bag
              </a>
              <a
                href='#'
                className='btn px-4 py-2 text-blue-500 border border-blue-500 rounded-lg hover:bg-blue-500 hover:text-white'
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
        <div
          className='w-full lg:w-1/2 bg-cover bg-center rounded-lg flex flex-col ml-4'
          style={{
            backgroundImage: 'url(/src/assetsA/images/222.jpg)',
          }}
        >
          <div className='flex-1 p-6'>
            <h2 className='text-2xl font-semibold mb-2  text-white'>
              Do more in style with Ray-Ban | Meta
            </h2>
            <p className='text-lg mb-4 text-white'>
              Next-generation smart glasses that blend an iconic look with
              cutting-edge technology.
            </p>
            <div className='flex space-x-2'>
              <a
                href='#'
                className='btn btn-lg custom-btn px-4 py-2 text-white rounded-lg bg-blue-500 hover:bg-blue-600 '
              >
                Shop all styles
              </a>
              <a
                href='#'
                className='btn px-4 py-2 text-blue-500 border border-blue-500 rounded hover:bg-blue-500 hover:text-white '
              >
                Learn more
              </a>
            </div>
          </div>
        </div>
      </div>
      <section className='shopsection py-8'>
        <div className='container mx-auto px-4'>
          <h1 className='text-3xl font-bold mb-4'>
            <strong>Meta Products</strong>
          </h1>
          <span className='block mb-4 text-lg'>
            The future of virtual reality, mixed reality, and smart glasses is
            here.
          </span>
          <img
            src='/src/assetsA/images/icons/minus.png'
            alt='Tools Icon'
            className='h-8 w-7/12 mx-auto mb-8'
          />
          <div className='grid grid-cols-1 md:grid-cols-4 gap-4'>
            <div className='image'>
              <img
                src='/src/assetsA/images/Meta Quest.jpg'
                alt='Meta Quest'
                className='w-full'
              />
              <p className='mt-2 text-center'>Meta Quest</p>
            </div>
            <div className='image'>
              <img
                src='/src/assetsA/images/Meta Quest accessories.jpg'
                alt='Meta Quest accessories'
                className='w-full'
              />
              <p className='mt-2 text-center'>Meta Quest accessories</p>
            </div>
            <div className='image'>
              <img
                src='/src/assetsA/images/Meta Quest mixed reality.jpg'
                alt='Meta Quest mixed reality'
                className='w-full'
              />
              1<p className='mt-2 text-center'>Meta Quest mixed reality</p>
            </div>
            <div className='image'>
              <img
                src='/src/assetsA/images/Ray-Ban Meta smart glasses.jpg'
                alt='Meta Portal'
                className='w-full'
              />
              <p className='mt-2 text-center'>Ray-Ban Meta smart glasses</p>
            </div>
          </div>
        </div>
      </section>
      <section id='banner' className='relative h-[400px] overflow-hidden'>
        <div className='swiper-container'>
          <div className='swiper-wrapper'>
            <video autoPlay muted loop className='w-full h-full object-cover'>
              <source
                src='/src/assetsA/images/vid/Chaar Sahibzaade.mp4'
                type='video/mp4'
              />
              Your browser does not support the video tag.
            </video>
          </div>
        </div>
      </section>
      <section>
        <div className='container text-center'>
          <div className='row shopimage-container'>
            <div className='col-md-12'>
              <h2 className='text-2xl font-bold mb-2'>
                Explore games and experiences
              </h2>
              <h2 className='text-2xl font-bold'>on meta quest</h2>
              <img
                src='/src/assetsA/images/icons/minus.png'
                alt='Tools Icon'
                className='h-8 w-7/12 mx-auto'
              />
            </div>
          </div>

          <div className='mt-4'></div>
          <div className='flex justify-center gap-4'>
            <div className='max-w-xs bg-white shadow-lg rounded-lg overflow-hidden'>
              <img
                src='/src/assetsA/images/charsahib.png'
                className='w-full h-56 object-cover'
                alt='Chaar Sahibzaade'
              />
              <div className='p-4'>
                <h4 className='text-xl font-semibold'>Chaar Sahibzaade</h4>
              </div>
            </div>

            <div className='max-w-xs bg-white shadow-lg rounded-lg overflow-hidden'>
              <img
                src='/src/assetsA/images/Scoffolding.png'
                className='w-full h-56 object-cover'
                alt='VR Constructor'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>VR Constructor</h5>
              </div>
            </div>

            <div className='max-w-xs bg-white shadow-lg rounded-lg overflow-hidden'>
              <img
                src='/src/assetsA/images/hospitalvr.png'
                className='w-full h-56 object-cover'
                alt='VR Hospital'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>VR Hospital</h5>
              </div>
            </div>

            <div className='max-w-xs bg-white shadow-lg rounded-lg overflow-hidden'>
              <img
                src='/src/assetsA/images/VRbody.png'
                className='w-full h-56 object-cover'
                alt='Meta Quest+'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>Meta Quest+</h5>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section>
        <div className='container mt-4'>
          <div className='flex flex-wrap'>
            <div className='w-full md:w-1/2 flex items-center'>
              <div className='mt-10'>
                <h3 className='text-8xl font-bold mb-4'>AR</h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit. Ipsa
                  eum est sunt repellendus pariatur omnis suscipit ullam esse
                  officia atque harum dolorum nobis possimus reiciendis id,
                  cumque, autem iste accusamus nisi? Eum dolores repellat fugit
                  enim doloremque, ipsa at dolore sapiente ullam non facere
                  mollitia reiciendis veniam maiores ad!
                </p>
              </div>
            </div>
            <div className='w-full md:w-1/2 flex justify-center'>
              <img
                src='/src/assetsA/images/VR-&-AR-Post.gif'
                alt='AR Example'
                className='w-7/12 h-96 object-cover'
              />
            </div>
          </div>
        </div>

        <div className='container mt-5'>
          <div className='flex flex-wrap'>
            <div className='w-full md:w-1/2 flex justify-center'>
              <img
                src='/src/assetsA/images/VR.jpg'
                alt='VR Example'
                className='w-7/12 h-96 object-cover'
              />
            </div>
            <div className='w-full md:w-1/2 flex items-center'>
              <div className='mt-10'>
                <h3 className='text-8xl font-bold mb-4'>VR</h3>
                <p>
                  Lorem ipsum dolor sit amet consectetur adipisicing elit.
                  Vitae, atque, fugiat est et commodi eaque laborum, laudantium
                  illo aperiam sunt nemo recusandae cumque sit similique!
                  Officia illum voluptas sequi dolorem nostrum, earum harum ab,
                  corporis quam quasi enim adipisci cum vitae animi ratione iure
                  voluptatibus? Qui rem omnis sunt aliquid voluptas quibusdam
                  autem corrupti eaque ducimus placeat dolor, incidunt velit
                  dignissimos maxime ut eius est provident fugiat pariatur!
                  Asperiores maxime fugiat distinctio officia doloribus,
                  pariatur beatae suscipit a. Architecto, quis?
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>
      <section className='container mt-4'>
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          <div className='col'>
            <div className='border-0'>
              <img
                src='/src/assetsA/images/metaquest3.png'
                className='w-full h-auto'
                alt='Meta Quest 3'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>
                  Meta Quest 3: The First Mass-Market Mixed Reality Headset
                </h5>
              </div>
            </div>
          </div>
          <div className='col'>
            <div className='border-0'>
              <img
                src='/src/assetsA/images/metaquest3.png'
                className='w-full h-auto'
                alt='Ray-Ban Meta Smart Glasses'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>
                  Introducing the Next-Generation Ray-Ban | Meta Smart Glasses
                  Collection
                </h5>
              </div>
            </div>
          </div>
          <div className='col'>
            <div className='border-0'>
              <img
                src='/src/assetsA/images/metaquest3.png'
                className='w-full h-auto'
                alt='Meta Connect 2023'
              />
              <div className='p-4'>
                <h5 className='text-lg font-semibold'>
                  Meta Connect 2023 Keynote Recap
                </h5>
              </div>
            </div>
          </div>
        </div>
      </section> */
}

// old home code end
