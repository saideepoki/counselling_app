import { getCurrentUser } from "@/lib/appwrite";
import { createContext, useContext, useState, useEffect } from "react";

const GlobalContext = createContext<{
    isLoading: boolean;
    isLoggedIn: boolean;
    setIsLoggedIn : any;
    user : any;
    setUser : any;
  }>({ isLoading: false, isLoggedIn: false, setIsLoggedIn: () => {}, user: null, setUser: () => {}});
export const useGlobalContext = () => useContext(GlobalContext);

const GlobalProvider = ({children} : {children : any}) =>  {
    const [isLoggedIn, setIsLoggedIn] = useState(false);
    const [user, setUser] = useState(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        getCurrentUser()
            .then((res : any) => {
                if(res) {
                    setIsLoggedIn(true);
                    setUser(res);
                }
                else {
                    setIsLoggedIn(false);
                    setUser(null);
                }
            })
            .catch((err : Error) => {
                console.error(err);
            })
            .finally(() => {
                setIsLoading(false);
            })
    }, []);
    return (
        <GlobalContext.Provider
        value = {{
            isLoggedIn,
            setIsLoggedIn,
            user,
            setUser,
            isLoading
        }}
        >
            {children}
        </GlobalContext.Provider>
    );
};

export default GlobalProvider