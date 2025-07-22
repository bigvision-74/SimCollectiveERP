import React, { useEffect, useState } from 'react';
// import { getSettingsAction } from '@/actions/userActions';

const FaviconUpdater = () => {
    const [faviconUrl, setFaviconUrl] = useState('');
    const [titleUrl, setTitleUrl] = useState('');

    useEffect(() => {
        const fetchSetting = async () => {
            // try {
            //     // const res = await getSettingsAction();
            //     if (res && res.meta_title) {
            //         setTitleUrl(res.meta_title);
            //     }
            //     if (res && res.favicon) {
            //         setFaviconUrl(res.favicon);
            //     }
            // } catch (error) {
            //     console.error("Error fetching settings:", error);
            // }
        };
        fetchSetting();
    }, []); 

    useEffect(() => {
        if (faviconUrl) {
            let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
            if (!link) {
                link = document.createElement('link') as HTMLLinkElement;
                link.rel = 'icon';
                document.head.appendChild(link);
                console.log("New favicon link element created and appended to head");
            }
            link.type = 'image/svg+xml';
            link.href = faviconUrl;
            document.title = titleUrl;
        }
    }, [faviconUrl]);

    return null; 
    //returning null here because we do not anything in like UI so just return null
};
 
export default FaviconUpdater;
