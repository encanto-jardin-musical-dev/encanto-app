'use client';

import { Alert, Button, Form, Input } from '@heroui/react';
import { useState } from 'react';
import { signin } from '@/utils/auth/actions';
import { useTranslations } from 'next-intl';

export default function LoginForm() {
  const t = useTranslations('LoginPage');
  const [email, setEmail] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [isError, setIsError] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    const formData = new FormData();
    formData.append('email', email);

    const result = await signin(formData);

    if (result.error) {
      setIsError(true);
      setErrorMessage(result.error);
      setIsSuccess(result.success);
    } else {
      setIsSuccess(result.success);
      setIsError(false);
      setErrorMessage('');
    }

    setIsLoading(false);
  };

  return (
    <Form
      className="w-full"
      validationBehavior="native"
      onSubmit={handleSubmit}
    >
      <Input
        label={t('email')}
        type="email"
        name="email"
        value={email}
        onChange={e => setEmail(e.target.value)}
        required
        autoComplete="email"
      />
      {isSuccess ? (
        <div className="w-full flex items-center my-3">
          <Alert
            color="success"
            title={t('magicLinkSuccessMessage', { email })}
          />
        </div>
      ) : null}
      {isError ? (
        <div className="w-full flex items-center my-3">
          <Alert
            color="danger"
            title={t('magicLinkErrorMessage')}
            description={errorMessage}
          />
        </div>
      ) : null}
      <div className="pt-9 w-full">
        <Button
          color="primary"
          fullWidth
          type="submit"
          size="lg"
          isLoading={isLoading}
        >
          {t('magicLinkButton')}
        </Button>
      </div>
    </Form>
  );
}
