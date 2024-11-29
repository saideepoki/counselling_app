export const isWithinScheduledTime = (meetings : any[]): boolean => {
    const currentTime = new Date();

    for(const meeting of meetings) {
        const meetingDate = new Date(meeting.date);
        const[hours, minutes] = meeting.time.split(':').map(Number);
        meetingDate.setHours(hours, minutes, 0, 0);

        // const bufferStart = new Date(meetingDate.getTime() - 30*60*1000);
        const bufferEnd = new Date(meetingDate.getTime() + 30*60*1000);
        if(currentTime <= bufferEnd) return true;
    }

    return false;
}