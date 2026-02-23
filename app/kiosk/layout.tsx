

import VoiceNavigation from "@/components/kiosk/VoiceNavigation";
import VoiceChatbot from "@/components/kiosk/VoiceChatbot";
import VoiceAssistant from "@/components/kiosk/VoiceAssistant";

const KioskLayout = ({ children }: { children: React.ReactNode }) => {

    return (
        <div >
            {/* Voice Navigation Assistant */}
            {/* <VoiceNavigation /> */}
            {/* Voice Chatbot Assistant */}
            {/* <VoiceChatbot /> */}
            <VoiceAssistant />
            {children}

        </div >
    );
};

export default KioskLayout;