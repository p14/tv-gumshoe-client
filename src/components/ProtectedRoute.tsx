import { useNavigate } from 'react-router-dom';
import { useSession } from '../helpers/session.helpers';
import { useSnackbarContext } from '../context/snackbar.context';
import { Box, Container } from '@mui/material';
import Footer from './Footer';
import { layoutContainerStyles, layoutContentContainerStyles } from '../styles/layout.styles';
import { UserSession } from '../typings/utility.types';
import { useEffect, useState } from 'react';
import { useRequest } from '../helpers/request.helpers';

interface ProtectedRouteProps {
    Component: React.FC<{
        refetchSubscriptionIds: () => void
        subscriptionIds: string[]
        userSession: UserSession
    }>
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ Component }) => {
    const navigate = useNavigate();
    const { makePublicRequest, parseErrorMessage } = useRequest();
    const { clearUserSession, getUserSession } = useSession();
    const userSession = getUserSession();

    const { setErrorAlert } = useSnackbarContext();

    const [loading, setLoading] = useState<boolean>(Boolean(userSession));
    const [subscriptionIds, setSubscriptionIds] = useState<string[]>([]);

    const getSubscriptionIds = async (session: UserSession) => {
        try {
            const params = new URLSearchParams(session);
            const url = `${import.meta.env.VITE_SERVER_URL}/subscriptions/shallow-info?${params}`;
            const { data } = await makePublicRequest({ url });
            setSubscriptionIds(data);
        } catch (e: any) {
            const message = parseErrorMessage(e);
            setErrorAlert(message);
        } finally {
            setLoading(false);
        }
    };

    const refetchSubscriptionIds = () => {
        setLoading(true);
    };

    useEffect(() => {
        if (userSession && loading) {
            getSubscriptionIds(userSession);
        }

        if (!userSession && !loading) {
            navigate('/');
        }
    }, [loading]);

    if (!userSession) {
        return null;
    }

    if (Date.now() > Number(userSession.expires)) {
        setErrorAlert('User session has expired.');
        clearUserSession();
        navigate('/');
        return null;
    }


    return (
        <Box sx={layoutContainerStyles}>
            <Container maxWidth='xl' sx={layoutContentContainerStyles}>
                <Component refetchSubscriptionIds={refetchSubscriptionIds} subscriptionIds={subscriptionIds} userSession={userSession} />
            </Container>
            <Footer />
        </Box>
    );
};

export default ProtectedRoute;
