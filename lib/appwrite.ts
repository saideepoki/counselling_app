import { Account, Avatars, Client, Databases, ID, Query, Storage} from 'react-native-appwrite';
import 'react-native-url-polyfill/auto'
import axios from 'axios';
import { sendEmailForPasscode } from './backend';
import { router } from 'expo-router';
import CryptoJS from 'crypto-js';
import {globalConfig} from '@/utils/config';

export const config = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.ai.znoforiaAi",
    projectId: "6700af320003461d216d",
    databaseId: "6700b1d50015fcc184a5",
    userCollectionId: "6700b218002b6efda538",
    audioCollectionId: "6700b30400393be5301c",
    conversationsCollectionId: "67230f400014653d183c",
    messagesCollectionId: "6700b32a000f8fc5d6b9",
    meetingCollectionId: "6741709f00173c9f244a",
    storageId: "6700bae7001170a21ca1",
}

// Init React Native SDK
const client = new Client();

client
    .setEndpoint(config.endpoint)
    .setProject(config.projectId)
    .setPlatform(config.platform)
;

const account = new Account(client);
const avatars = new Avatars(client);
const database = new Databases(client);
const storage = new Storage(client);


export const createUser = async (username : string, email : string, password : string, role: 'user' | 'admin' = 'user') => {
    try {
        const newAccount = await account.create(
            ID.unique(),
            email,
            password,
            username
        )

        if(!newAccount) throw Error;

        const avatarUrl = avatars.getInitials(username);

        await signIn(email, password);

        const newUser = await database.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                userId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl,
                role: role
            },
        )

        return newUser;
    } catch (error: unknown) {
        console.error(error)
        throw new Error(String(error));
    }
}


const generatePasscode = (email : string, offset?: number) => {
    const secretKey = globalConfig.serverSecretKey;
    const timestamp = Math.floor(Date.now() / (1000 * 60 * 5)) + (offset ?? 0);
    const passcode = CryptoJS.HmacSHA256(email + timestamp, secretKey)
    .toString(CryptoJS.enc.Hex)
    .slice(0, 8)
    .toUpperCase();
    console.log(passcode);
    return passcode;
};


export const registerOrganization = async (orgName : string, adminEmail : string, password: string) => {
    try {
        const passcode = generatePasscode(adminEmail);
        const newAccount = await account.create(
            ID.unique(),
            adminEmail,
            password,
            orgName
        )
        if(!newAccount) throw Error;

        const avatarUrl = await avatars.getInitials(orgName);

        const newOrg = database.createDocument(
            config.databaseId,
            config.userCollectionId,
            ID.unique(),
            {
                userId: newAccount.$id,
                email: adminEmail,
                username: orgName,
                avatar: avatarUrl,
                role: 'admin',
                isPasscodeValidated: false
            }
        )

        await sendEmailForPasscode(adminEmail, passcode);
        return newOrg;
    } catch (error : unknown) {
        throw new Error(String(error));
    }
}

export const getCurrentUser = async () => {
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await database.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('userId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0]
    } catch (error) {
        console.error(error)
    }
}

export const getCurrentUserId = async () => {
    try {
        const currentAccount = await account.get();

        if(!currentAccount) throw Error;

        const currentUser = await database.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('userId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0].$id
    } catch (error) {
        
    }
}

const validatePasscode = (email : string, providedPasscode?: string) => {
    const currentPasscode = generatePasscode(email);
    const previousPasscode = generatePasscode(email, -1);
    if(!providedPasscode) return false;

    if(providedPasscode !== currentPasscode && providedPasscode !== previousPasscode) {
        throw new Error('Invalid passcode');
    }


    return true;
}

export const signIn = async (email : string, password : string, providedPasscode?:string) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);

        const userDoc = await database.listDocuments(
            config.databaseId,
            config.userCollectionId,
            [Query.equal('email', email)]
        );
        
        if(userDoc.total === 0) {
            throw new Error("User not found");
        }

        const user = userDoc.documents[0];
        if(user.role === 'admin' && !user.isPasscodeValidated) {
            if(!providedPasscode) {
                throw new Error("Passcode is required for first time admin sign-in");
            }

            const isPasscodeValid = validatePasscode(email, providedPasscode);
            if(!isPasscodeValid) {
                throw new Error("Invalid Passcode");
            }

            await database.updateDocument(
                config.databaseId,
                config.userCollectionId,
                user.$id,
                {
                    isPasscodeValidated: true
                }
            )
        }

        return user;
    } catch (error : unknown) {
        throw new Error(String(error));
    }
}


export const createConversation  = async () => {
    const userId = await getCurrentUserId();
    try {
        const newConversation = await database.createDocument(
            config.databaseId,
            config.conversationsCollectionId,
            ID.unique(),
            {
                userId: userId,
                conversationId: ID.unique()
            }
        )

        console.log(newConversation);
        return newConversation.$id;
    } catch (error) {
        console.error(String(error))
    }
}

export const getConversations = async () => {
    try {
        const userId = await getCurrentUserId();
        if(!userId) throw new Error;
        const conversations = await database.listDocuments(
            config.databaseId,
            config.conversationsCollectionId,
            [Query.equal('userId', userId), Query.orderDesc('$createdAt')]
        )

        return conversations.documents;
    } catch (error) {
        
    }
}


export const getMessages = async (conversationDocumentId : string) => {
    try {

        console.log(conversationDocumentId);
        const initialMessages = await database.listDocuments(
            config.databaseId,
            config.messagesCollectionId,
            [
                Query.equal("conversationIdString", [conversationDocumentId]),
                Query.orderDesc('timestamp')
            ]
        )

        if(!initialMessages) throw new Error;

        console.log("fetched");

        return initialMessages.documents;
    } catch (error) {
        console.error(String(error))
    }
}

export const scheduleMeeting = async (email : string, date : string, time : string) => {

    const user = await getCurrentUser();
    if(!user) throw new Error;
    if(user.role !== 'admin') throw new Error;
    try {
        const newMeeting = database.createDocument(
            config.databaseId,
            config.meetingCollectionId,
            ID.unique(),
            {
                user_email : email,
                date : date,
                time : time,
                status : "scheduled",
                adminId: user.$id
            }
        )
        return newMeeting;
    } catch (error) {
        console.error(error);
    }
}

export const getMeetings = async() => {
    try {

        const user = await getCurrentUser();
        if(!user) throw new Error;
        if(user.role !== 'admin') throw new Error;
        const meetings = await database.listDocuments(
            config.databaseId,
            config.meetingCollectionId,
            [
                Query.equal('adminId', user.$id),
            ]
        )

        return meetings.documents;
    } catch (error) {
        console.error(error);
    }
}

export const fetchUserMeetings = async () => {
   try {
     const currentUser = await getCurrentUser();
     if(!currentUser) throw new Error;
     const meetings = await database.listDocuments(
         config.databaseId,
         config.meetingCollectionId,
         [
             Query.equal('user_email', currentUser.email),
         ]
     )
     console.log(meetings.documents);
     return meetings.documents;
   } catch (error) {
     console.error('Failed to fetch meetings', error);
   }
}

export const updateUserProfile = async (username : string , avatar : string) => {
    try {
        const user = await getCurrentUser();
        if(!user) throw new Error;
        const updatedUser = await database.updateDocument(
            config.databaseId,
            config.userCollectionId,
            user.$id,
            {
                username : username,
                avatar : avatar
            }
        )
        return updatedUser;
    } catch (error) {
        console.error(error);
    }
}


export const processAudio = async (fileId: string) => {
    try {
        // Download file from Appwrite
        const file = await storage.getFileDownload('YOUR_BUCKET_ID', fileId);

        // Convert file to FormData
        const formData = new FormData();

        const blob = await fetch(file).then(response => response.blob());
        formData.append('file', blob, 'audio.wav');

        // Send to FastAPI
        const response = await axios.post('YOUR_FASTAPI_ENDPOINT/process_audio', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
        });

        return response.data;
    } catch (error) {
        console.error('Error processing audio:', error);
        throw error;
    }
};


  export const uploadFile = async (file : any, type : any) => {
        if(!file) return;
        // const{mimeType, ...rest} = file;
        // const { _options: { web: { mimeType } }, _uri: uri, ...rest} = file;
        // const mimeType = file._options.web.mimeType;
        // const name = `recording-${Date.now()}.m4a`;
        // const uri = file._uri;
        // console.log(mimeType, uri);
        const asset = {...file};
        console.log(asset);

        try {
            const uploadedFile = await storage.createFile(
                config.storageId,
                ID.unique(),
                asset
            );

            console.log("File created", uploadedFile);

            const fileUrl = await storage.getFileView(
                config.storageId,
                uploadedFile.$id
            )

            return fileUrl;
        } catch (error : unknown) {
            throw new Error(String(error));
        }
  }

  export const createAudio = async (form : any) => {
     try {
        const audioUrl = await uploadFile(form.audio, 'audio');
        return audioUrl;
     } catch (error : unknown) {
        throw new Error(String(error));
     }
  }






