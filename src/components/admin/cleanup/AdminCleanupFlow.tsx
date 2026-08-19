"use client";
import { useCleanupExecuteMutation } from '@/hooks/UseCleanupExecuteMutation';
import { useCleanupPreviewMutation } from '@/hooks/UseCleanupPreviewMutation';
import {
  CLEANUP_CONFIRMATION_PHRASE,
  type CleanupEntityKey,
} from '@/types/admin.types';
import {
  Button,
  Input,
  Table,
  TableBody,
  TableCell,
  TableColumn,
  TableHeader,
  TableRow,
} from '@heroui/react';
import {
  CheckCircleIcon,
  ExclamationTriangleIcon,
  PlayIcon,
  TrashIcon,
} from '@heroicons/react/24/outline';
import { useFormatter, useTranslations } from 'next-intl';
import { useState } from 'react';

const ENTITY_KEYS: CleanupEntityKey[] = ['messages', 'tasks', 'reports'];

/**
 * 3-step admin cleanup flow:
 *   1. Run a dry-run preview → per-entity summary with the pinned cutoff date.
 *   2. Type the confirmation phrase to enable the execute action.
 *   3. Execute → per-entity deletion results.
 */
export function AdminCleanupFlow() {
  const t = useTranslations('AdminCleanup');
  const format = useFormatter();
  const previewMutation = useCleanupPreviewMutation();
  const executeMutation = useCleanupExecuteMutation();
  const [confirmation, setConfirmation] = useState('');

  const preview = previewMutation.data;
  const results = executeMutation.data;
  const phraseMatches = confirmation === CLEANUP_CONFIRMATION_PHRASE;

  const cutoffLabel = preview
    ? format.dateTime(new Date(preview.cutoff), { dateStyle: 'long', timeStyle: 'short' })
    : null;

  function handleExecute() {
    if (!preview || !phraseMatches) return;
    executeMutation.mutate({
      cutoff: preview.cutoff,
      confirmationPhrase: confirmation,
    });
  }

  return (
    <div className="flex flex-col gap-6 overflow-auto max-w-2xl">
      <p className="text-default-600">{t('description')}</p>

      {/* Step 1: Preview */}
      {!preview && (
        <div className="flex flex-col gap-3">
          <Button
            color="primary"
            startContent={<PlayIcon className="w-4 h-4" />}
            onPress={() => previewMutation.mutate()}
            isLoading={previewMutation.isPending}
            className="self-start"
          >
            {t('preview.action')}
          </Button>
          {previewMutation.isError && (
            <p className="text-danger text-sm">{t('preview.error')}</p>
          )}
        </div>
      )}

      {/* Step 2: Summary + typed confirmation */}
      {preview && !results && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t('summary.title')}</h2>
          <p className="text-default-600 text-sm">
            {t('summary.cutoffLabel', { cutoff: cutoffLabel ?? preview.cutoff })}
          </p>
          <Table aria-label={t('summary.title')} removeWrapper>
            <TableHeader>
              <TableColumn>{t('summary.columns.entity')}</TableColumn>
              <TableColumn>{t('summary.columns.rows')}</TableColumn>
              <TableColumn>{t('summary.columns.objects')}</TableColumn>
            </TableHeader>
            <TableBody>
              {ENTITY_KEYS.map((key) => (
                <TableRow key={key}>
                  <TableCell>{t(`entities.${key}`)}</TableCell>
                  <TableCell>{preview.entities[key].rows}</TableCell>
                  <TableCell>{preview.entities[key].objects}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>

          <div className="flex flex-col gap-2">
            <Input
              label={t('confirm.prompt', { phrase: CLEANUP_CONFIRMATION_PHRASE })}
              placeholder={CLEANUP_CONFIRMATION_PHRASE}
              value={confirmation}
              onValueChange={setConfirmation}
              variant="bordered"
              isDisabled={executeMutation.isPending}
            />
            <Button
              color="danger"
              startContent={<TrashIcon className="w-4 h-4" />}
              isDisabled={!phraseMatches}
              isLoading={executeMutation.isPending}
              onPress={handleExecute}
              className="self-start"
            >
              {t('execute.action')}
            </Button>
            {executeMutation.isError && (
              <p className="text-danger text-sm">{t('execute.error')}</p>
            )}
          </div>
        </div>
      )}

      {/* Step 3: Results */}
      {results && (
        <div className="flex flex-col gap-4">
          <h2 className="text-lg font-semibold">{t('results.title')}</h2>
          <Table aria-label={t('results.title')} removeWrapper>
            <TableHeader>
              <TableColumn>{t('results.columns.entity')}</TableColumn>
              <TableColumn>{t('results.columns.rowsDeleted')}</TableColumn>
              <TableColumn>{t('results.columns.objectsDeleted')}</TableColumn>
              <TableColumn>{t('results.columns.status')}</TableColumn>
            </TableHeader>
            <TableBody>
              {ENTITY_KEYS.map((key) => {
                const entity = results.entities[key];
                return (
                  <TableRow key={key}>
                    <TableCell>{t(`entities.${key}`)}</TableCell>
                    <TableCell>{entity.rowsDeleted}</TableCell>
                    <TableCell>{entity.objectsDeleted}</TableCell>
                    <TableCell>
                      {entity.error ? (
                        <span className="flex items-center gap-1 text-danger text-sm">
                          <ExclamationTriangleIcon className="w-4 h-4" />
                          {entity.error}
                        </span>
                      ) : (
                        <span className="flex items-center text-success">
                          <CheckCircleIcon className="w-5 h-5" />
                        </span>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  );
}
