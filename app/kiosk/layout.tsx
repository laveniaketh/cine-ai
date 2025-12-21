

import VoiceNavigation from "@/components/kiosk/VoiceNavigation";
import VoiceChatbot from "@/components/kiosk/VoiceChatbot";

const KioskLayout = ({ children }: { children: React.ReactNode }) => {

    return (
        <div >
            {/* Voice Navigation Assistant */}
            <VoiceNavigation />
            {/* Voice Chatbot Assistant */}
            <VoiceChatbot />
            {children}

        </div >
    );
};

export default KioskLayout;