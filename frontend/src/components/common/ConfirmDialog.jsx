import React from 'react';
import Modal from '../ui/Modal';
import Button from '../ui/Button';

const ConfirmDialog = ({
  isOpen,
  onClose,
  onConfirm,
  title = "Подтверждение",
  message = "Вы уверены?",
  confirmText = "Подтвердить",
  cancelText = "Отмена",
  danger = false
}) => {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title}>
      <div className="space-y-4">
        <p className="text-gray-600">{message}</p>
        <div className="flex gap-3 justify-end">
          <Button 
            onClick={onClose}
            variant="secondary"
          >
            {cancelText}
          </Button>
          <Button 
            onClick={handleConfirm}
            variant={danger ? "danger" : "primary"}
          >
            {confirmText}
          </Button>
        </div>
      </div>
    </Modal>
  );
};

export default ConfirmDialog;