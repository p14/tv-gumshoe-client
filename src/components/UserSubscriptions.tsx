import { useEffect, useState } from 'react';
import { Box, Button, LinearProgress, Typography } from '@mui/material';
import MediaCard from './MediaCard';
import { useRequest } from '../helpers/request.helpers';
import { userSubscriptionContainerStyles, userSubscriptionTitleStyles } from '../styles/subscription.styles';
import RemoveConfirmationDialog from './Dialogs/RemoveConfirmationDialog';
import { useSnackbarContext } from '../context/snackbar.context';
import { UserSession } from '../typings/utility.types';
import { linearProgressionStyles } from '../styles/global.styles';
import { MediaContent } from '../typings/media.types';
import MediaInfoDialog from './Dialogs/MediaInfoDialog';
import { useNavigate } from 'react-router-dom';
import { ArrowBack } from '@mui/icons-material';

interface ManageSubscriptionsProps {
    refetchSubscriptionIds: () => void
    subscriptionIds: string[]
    userSession: UserSession
}

const ManageSubscriptions: React.FC<ManageSubscriptionsProps> = ({
    refetchSubscriptionIds,
    userSession,
}) => {
    const navigate = useNavigate();
    const { makePublicRequest, parseErrorMessage } = useRequest();

    const { setErrorAlert } = useSnackbarContext();

    const [subscriptionMediaList, setSubscriptionMediaList] = useState<MediaContent[]>([]);
    const [selectedSubscriptionMedia, setSelectedSubscriptionMedia] = useState<MediaContent | undefined>();
    const [openDialog, setOpenDialog] = useState<'info' | 'unsubscribe' | undefined>();
    const [loading, setLoading] = useState<boolean>(true);

    const handleOpenInfoDialog = (mediaContent: MediaContent) => {
        setSelectedSubscriptionMedia(mediaContent);
        setOpenDialog('info');
    };

    const handleOpenUnsubscribeDialog = (mediaContent: MediaContent) => {
        setSelectedSubscriptionMedia(mediaContent);
        setOpenDialog('unsubscribe');
    };

    const handleCloseDialog = () => {
        setSelectedSubscriptionMedia(undefined);
        setOpenDialog(undefined);
    };

    const getSubscriptionContent = async ({ email, expires, signature }: UserSession) => {
        try {
            const params = new URLSearchParams({ email, expires, signature });
            const url = `${import.meta.env.VITE_SERVER_URL}/subscriptions?${params}`;
            const { data } = await makePublicRequest({ url });

            setSubscriptionMediaList(data);
        } catch (e: any) {
            const message = parseErrorMessage(e);
            setErrorAlert(message);
        } finally {
            setLoading(false);
        }
    };

    const onDeleteSubscription = () => {
        setLoading(true); // useEffect will refetch subscription data
        refetchSubscriptionIds();
        handleCloseDialog();
    }

    useEffect(() => {
        if (loading) {
            getSubscriptionContent(userSession);
        }
    }, [loading]);

    return (
        <>
            {loading && <LinearProgress sx={linearProgressionStyles} />}
            <Box sx={{ display: 'flex', flexDirection: 'column', py: 5 }}>
                <Typography component='h1' variant='h4' sx={userSubscriptionTitleStyles}>
                    Manage Your Subscriptions
                </Typography>
                <Button
                    variant='contained'
                    size='small'
                    startIcon={<ArrowBack />}
                    onClick={() => navigate('/dashboard')}
                    sx={{ alignSelf: 'center', my: 2 }}>
                    Back
                </Button>
                <Box sx={userSubscriptionContainerStyles}>
                    {subscriptionMediaList.map((mediaContent) => (
                        <MediaCard
                            key={mediaContent.id}
                            mediaContent={mediaContent}
                            openInfoDialog={() => { handleOpenInfoDialog(mediaContent); }}
                            inSubscription
                            openPrimaryActionDialog={() => { handleOpenUnsubscribeDialog(mediaContent); }} />
                    ))}
                </Box>
                <MediaInfoDialog
                    open={openDialog === 'info'}
                    onClose={handleCloseDialog}
                    mediaContent={selectedSubscriptionMedia}
                    inSubscription
                    openPrimaryActionDialog={handleOpenUnsubscribeDialog} />
                <RemoveConfirmationDialog
                    open={openDialog === 'unsubscribe'}
                    onClose={handleCloseDialog}
                    subscriptionMedia={selectedSubscriptionMedia}
                    onDeleteSubscription={onDeleteSubscription} />
            </Box>
        </>
    )
}

export default ManageSubscriptions;
