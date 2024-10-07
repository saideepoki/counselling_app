import { Account, Avatars, Client, Databases, ID } from 'react-native-appwrite';
import 'react-native-url-polyfill/auto'

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


