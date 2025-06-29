import React, { useState } from 'react';
import { Easing, Animated} from "react-native";
import AsyncStorage from '@react-native-async-storage/async-storage';
import AuthContext from './../store/auth'
import API from "./../services/api"
import User from './../services/user';


import { createStackNavigator } from "@react-navigation/stack";
import { createDrawerNavigator } from "@react-navigation/drawer";

import { Language } from '../constants'
import config from '../config';

//Stacks
import PublicAppStack from './ChatStack/PublicAppStack';
import AuthenticatedAppStack from './ChatStack/AuthenticatedAppStack';

const Stack = createStackNavigator();


export default function App({ navigation }) {
  const [state, dispatch] = React.useReducer(
    (prevState, action) => {
      switch (action.type) {
        case 'RESTORE_TOKEN':
          return {
            ...prevState,
            userToken: action.token,
            isLoading: false,
          };
        case 'SIGN_IN':
          return {
            ...prevState,
            isSignout: false,
            userToken: action.token,
          };
        case 'SIGN_OUT':
          return {
            ...prevState,
            isSignout: true,
            userToken: null,
          };
      }
    },
    {
      isLoading: true,
      isSignout: false,
      userToken: null,
    }
  );

  React.useEffect(() => {
    // Fetch the token from storage then navigate to our appropriate place
    const bootstrapAsync = async () => {
      let userToken;
      config.DRIVER_APP=false;
      config.VENDOR_APP=false;
      config.CHAT_APP=true;

      try {
        userToken = await AsyncStorage.getItem('token');
      } catch (e) {
        // Restoring token failed
      }

      // After restoring token, we may need to validate it in production apps

      // This will switch to the App screen or Auth screen and this loading
      // screen will be unmounted and thrown away.
      dispatch({ type: 'RESTORE_TOKEN', token: userToken });
    };

    bootstrapAsync();
  }, []);

  const authContext = React.useMemo(
    () => ({
      signIn: async data => {
        console.log("Sign in - curent chat app");
        console.log(JSON.stringify(data));
        API.loginUser(data.email,data.password,data.expoPushToken,(responseJson)=>{
          console.log(JSON.stringify(responseJson));
           if(responseJson.status){
             //User ok
             User.setLoggedInUser(responseJson,()=>{
              dispatch({ type: 'SIGN_IN', token: responseJson.token });
              
             })
           }else{
             //Not ok
             Toast.show({
              type: 'error',
              text2: responseJson.message?responseJson.message:responseJson.errMsg
            });
           }
         });
      },
      signOut: async data => {
        User.logout(()=>{
          dispatch({ type: 'SIGN_OUT' })
        })
      },
      signUp: async data => {
        API.registerUser(data.name,data.email,data.password,data.phone,(responseJson)=>{
          console.log(JSON.stringify(responseJson));
           if(responseJson.status){
              //User ok - but needs admin approval
              User.logout(()=>{
                dispatch({ type: 'SIGN_OUT' })
                Toast.show({
                  type: 'error',
                  text2: Language.VendorCreated
                });
                
              })
              
              
               
           }else{
             //Not ok
             Toast.show({
              type: 'error',
              text2: JSON.stringify(responseJson.errMsg)
            });
           }
           
           
         });


        
      },
    }),
    []
  );



  return (
    <AuthContext.Provider value={authContext}>
      <Stack.Navigator screenOptions={{headerShown: false}}>
        <Stack.Screen name="App" options={{}} component={state.userToken == null ? PublicAppStack : AuthenticatedAppStack} />
      </Stack.Navigator>
    </AuthContext.Provider>
  );
}