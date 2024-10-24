import { Account, Avatars, Client, Databases, ID, Query, Storage} from 'react-native-appwrite';
import 'react-native-url-polyfill/auto'
import axios from 'axios';

export const config = {
    endpoint: "https://cloud.appwrite.io/v1",
    platform: "com.ai.znoforiaAi",
    projectId: "6700af320003461d216d",
    databaseId: "6700b1d50015fcc184a5",
    userCollectionId: "6700b218002b6efda538",
    audioCollectionId: "6700b30400393be5301c",
    conversationsCollectionId: "6700b32a000f8fc5d6b9",
    storageId: "6700bae7001170a21ca1"
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


export const createUser = async (username : string, email : string, password : string) => {
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
                accountId: newAccount.$id,
                email: email,
                username: username,
                avatar: avatarUrl
            },
        )

        return newUser;
    } catch (error: unknown) {
        console.error(error)
        throw new Error(String(error));
    }
}

export const signIn = async (email : string, password : string) => {
    try {
        const session = await account.createEmailPasswordSession(email, password);
        return session;
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
            [Query.equal('accountId', currentAccount.$id)]
        )

        if(!currentUser) throw Error;

        return currentUser.documents[0]
    } catch (error) {
        console.error(error)
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


