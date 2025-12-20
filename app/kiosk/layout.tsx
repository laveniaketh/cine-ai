

import VoiceNavigation from "@/components/kiosk/VoiceNavigation";

const KioskLayout = ({ children }: { children: React.ReactNode }) => {

    return (
        <div >
            {/* Voice Navigation Assistant */}
            <VoiceNavigation />

            {/* Voice Chatbot Assistant */}
            {/*<VoiceChatbot />*/}

            {children}

        </div >
    );
};

export default KioskLayout;