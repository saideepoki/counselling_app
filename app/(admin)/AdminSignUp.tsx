import { View, Text, SafeAreaView, ScrollView, Image, Alert } from 'react-native';
import React, { useState } from 'react';
import { images } from '@/constants';
import FormField from '@/components/FormField';
import CustomButton from '@/components/CustomButton';
import { Link, router } from 'expo-router';
import { registerOrganization } from '@/lib/appwrite';

const AdminSignUp = () => {

    const [form, setForm] = useState({
        orgName: '',
        adminEmail: '',
        password: '',
    });

    const[isSubmitting, setIsSubmitting] = useState(false);

    const submit = async () => {
        if(!form.orgName || !form.adminEmail) {
            Alert.alert('Oops', 'Please fill in all the fields');
            return;
        }

        setIsSubmitting(true);
        try {
            const result = await registerOrganization(form.orgName, form.adminEmail, form.password);
            Alert.alert(
                'Success',
                'Organization registered successfully! The passcode has been sent to ${form.adminEmail}.'
            );

            router.replace('/signIn');
        } catch (error : unknown) {
            console.error(error);
        } finally {
            setIsSubmitting(false);
        }
    }
  return (
    <SafeAreaView className = 'bg-zinc-900 h-full'>
        <ScrollView>
            <View className = 'w-full justify-center min-h-[85vh] px-4 my-6'>
                <Image
                    source = {images.logo}
                    className = 'w-48 h-48 rounded-full bg-transparent'
                    resizeMode='contain'
                />
                <Text className = 'text-2xl text-white font-psemibold mt-10'>
                    Register Your Organization
                </Text>

                {/* Organization name field */}
                <FormField
                    title='Organization Name'
                    value = {form.orgName}
                    handleChangeText={(e : string) => {
                        setForm({
                            ...form,
                            orgName: e
                        });
                    }}
                    otherStyles='mt-7'
                />

                {/* Admin Email fiels*/}
                <FormField
                    title = 'Admin Email'
                    value = {form.adminEmail}
                    handleChangeText={(e: string) => {
                        setForm({
                            ...form,
                            adminEmail: e
                        })
                    }}
                    otherStyles='mt-7'
                />

                {/* Admin Email fiels*/}
                <FormField
                    title = 'Password'
                    value = {form.password}
                    handleChangeText={(e: string) => {
                        setForm({
                            ...form,
                            password: e
                        })
                    }}
                    otherStyles='mt-7'
                />

                <CustomButton
                    title="Register Organization"
                    containerStyles="mt-7"
                    handlePress={submit}
                    isLoading={isSubmitting}
                />

                <View className = "justify-center pt-5 flex-row gap-2">
                    <Text className = "text-lg text-gray-100 font-pregular">
                        Already have an account?
                    </Text>
                    <Link
                    href = '/signIn'
                    className="text-lg font-psemibold text-cyan-500"
                    >
                        Sign In
                    </Link>
                </View>
            </View>
        </ScrollView>
    </SafeAreaView>
  )
}

export default AdminSignUp