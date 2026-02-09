import React, { createContext, useContext, useState, useCallback } from "react";
import { CustomAlert } from "../components/CustomAlert";

const AlertContext = createContext({});

export function useAlert() {
    return useContext(AlertContext);
}

export function AlertProvider({ children }) {
    const [config, setConfig] = useState(null); // { title, message, buttons }
    const [visible, setVisible] = useState(false);

    const showAlert = useCallback((title, message, buttons) => {
        // Intercept button presses to close alert
        const interceptedButtons = buttons ? buttons.map(b => ({
            ...b,
            onPress: () => {
                setVisible(false);
                if (b.onPress) b.onPress();
                // Clear config after animation mainly, but for simplicity:
                setTimeout(() => setConfig(null), 200);
            }
        })) : [{
            text: 'OK',
            onPress: () => {
                setVisible(false);
                setTimeout(() => setConfig(null), 200);
            }
        }];

        setConfig({ title, message, buttons: interceptedButtons });
        setVisible(true);
    }, []);

    const hideAlert = useCallback(() => {
        setVisible(false);
        setTimeout(() => setConfig(null), 200);
    }, []);

    return (
        <AlertContext.Provider value={{ showAlert, hideAlert }}>
            {children}
            <CustomAlert
                visible={visible}
                title={config?.title}
                message={config?.message}
                buttons={config?.buttons}
                onClose={hideAlert}
            />
        </AlertContext.Provider>
    );
}
