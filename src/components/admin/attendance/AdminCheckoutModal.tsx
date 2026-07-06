"use client";
import { Modal, ModalContent, ModalHeader, ModalBody, ModalFooter, Button } from '@heroui/react';
import { useAdminCheckOutMutation } from '@/hooks/UseAdminCheckOutMutation';
import { useTranslations } from 'next-intl';
import { formatTime } from '@/utils/formatTime';
import type { CheckoutChild } from './AdminAttendanceOverview';

type AdminCheckoutModalProps = {
  child: CheckoutChild | null;
  onClose: () => void;
};

export function AdminCheckoutModal({ child, onClose }: AdminCheckoutModalProps) {
  const t = useTranslations('AdminAttendance');
  const checkoutMutation = useAdminCheckOutMutation();

  if (!child) return null;



  const handleCheckout = async () => {
    try {
      await checkoutMutation.mutateAsync(child.id);
      onClose();
    } catch (error) {
      // Error is handled by the mutation hook and react-query
      console.error('Checkout failed:', error);
    }
  };

  return (
    <Modal isOpen={!!child} onClose={onClose} placement="center">
      <ModalContent>
        {(onCloseModal) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              {t('checkoutModal.title')}
            </ModalHeader>
            <ModalBody>
              <div className="flex flex-col gap-2">
                <p className="text-large font-medium">{child.name}</p>
                <p className="text-default-600">
                  {t('checkoutModal.checkInTime')}:{' '}
                  <span className="font-medium">
                    {formatTime(child.checkInTime)}
                  </span>
                </p>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button
                color="default"
                variant="light"
                onPress={onCloseModal}
                isDisabled={checkoutMutation.isPending}
              >
                {t('checkoutModal.cancel')}
              </Button>
              <Button
                color="primary"
                onPress={handleCheckout}
                isLoading={checkoutMutation.isPending}
              >
                {t('checkoutModal.checkout')}
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}