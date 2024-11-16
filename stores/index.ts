import { useUserStore } from '@/stores/authStore';
import { useDiaryStore } from '@/stores/diaryStore';
import { useAnswerStore } from '@/stores/answerStore';
import { useMediaStore } from './mediaStore';
import { useQuestionStore } from './responseStore';
import { useMedicineStore } from './medicinStore';
import { useDepartmentsStore } from './departmentsStore';
import { useDiagnosisStore } from './diagnosisStore';
import { useProcedureStore } from './procedureStore';

export {
  useUserStore,
  useDiaryStore,
  useAnswerStore,
  useMediaStore,
  useQuestionStore,
  useMedicineStore,
  useDepartmentsStore,
  useDiagnosisStore,
  useProcedureStore
}