import { useState, useEffect } from 'react'
import { AuthenticatedTemplate, UnauthenticatedTemplate } from '@azure/msal-react'
import Header from './components/Header'
import InfoBanner from './components/InfoBanner'
import WeekNav from './components/WeekNav'
import MemberSection from './components/MemberSection'
import LoginPage from './components/LoginPage'
import TaskModal from './components/modals/TaskModal'
import CarryoverModal from './components/modals/CarryoverModal'
import MemberModal from './components/modals/MemberModal'
import MemberManageModal from './components/modals/MemberManageModal'
import ConfirmDialog from './components/modals/ConfirmDialog'
import TeamsReportModal from './components/modals/TeamsReportModal'
import { getTodayTasks } from './utils/teamsUtils'
import { useWOWState } from './hooks/useWOWState'
import { useAuth } from './auth/useAuth'
import { getWeekKeys } from './utils/weekUtils'
import { uid } from './utils/weekUtils'
import StatusBoard from './components/StatusBoard'

function Board() {
  const wow = useWOWState()
  const { displayName, email, logout } = useAuth()
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)

  const wk = getWeekKeys(wow.state.baseWeekOffset)

  // 로그인 시 현재 유저를 멤버 목록에 자동 등록/매칭 (훅은 early return 전에 위치해야 함)
  useEffect(() => {
    if (!displayName || wow.loading || wow.fsError) return
    const exists = wow.state.members.find(
      m => m.email === email || m.name === displayName
    )
    if (!exists) {
      wow.addMember({ name: displayName, rank: '팀원', emoji: '👤', email })
    } else if (exists.email !== email) {
      wow.updateMember(exists.id, { ...exists, email })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, email, wow.loading])

  if (wow.loading) {
    return (
      <div className="min-h-screen bg-jira-bg flex items-center justify-center">
        <div className="text-center text-jira-muted">
          <div className="text-4xl mb-3">🗂</div>
          <div className="text-sm">데이터를 불러오는 중...</div>
        </div>
      </div>
    )
  }

  if (wow.fsError) {
    return (
      <div className="min-h-screen bg-jira-bg flex items-center justify-center">
        <div className="text-center max-w-md px-6">
          <div className="text-4xl mb-3">⚠️</div>
          <div className="text-base font-bold text-jira-dark mb-2">Firestore 연결 실패</div>
          <div className="text-sm text-jira-muted mb-1">Firestore 보안 규칙을 확인해주세요.</div>
          <div className="text-xs font-mono bg-white border border-jira-border rounded px-3 py-2 text-red-600 mt-2">
            {wow.fsError}
          </div>
          <div className="text-xs text-jira-muted mt-3">
            Firebase 콘솔 → Firestore → 규칙 탭에서<br />
            <code className="bg-white px-1 rounded">allow read, write: if true;</code> 로 임시 허용
          </div>
        </div>
      </div>
    )
  }

  const openConfirm = (title, message, onConfirm) => setConfirm({ title, message, onConfirm })

  // 현재 로그인한 유저의 멤버 ID
  const myMemberId = wow.state.members.find(
    m => m.email === email || m.name === displayName
  )?.id

  // 내 섹션이 맨 위로 오도록 정렬
  const sortedMembers = myMemberId
    ? [
        ...wow.state.members.filter(m => m.id === myMemberId),
        ...wow.state.members.filter(m => m.id !== myMemberId),
      ]
    : wow.state.members

  return (
    <div className="min-h-screen bg-jira-bg">
      <Header
        onManageMembers={() => setModal({ type: 'memberManage' })}
        onAddMember={() => setModal({ type: 'addMember' })}
        displayName={displayName}
        onLogout={logout}
      />

      <div className="max-w-[1600px] mx-auto px-4 py-5">
        <InfoBanner />

        <StatusBoard
          members={wow.state.members}
          myMemberId={myMemberId}
          onUpdatePresence={wow.updatePresence}
          onEndOfDay={myMemberId ? () => setModal({ type: 'teamsReport' }) : undefined}
        />

        <WeekNav
          wk={wk}
          onPrev={() => wow.shiftWeeks(-1)}
          onNext={() => wow.shiftWeeks(1)}
          onToday={wow.goToCurrentWeek}
          isCurrentWeek={wow.state.baseWeekOffset === 0}
        />

        {sortedMembers.length === 0 ? (
          <div className="text-center py-16 text-jira-muted">
            <div className="text-5xl mb-3">👤</div>
            <div className="text-sm">담당자를 추가해주세요</div>
          </div>
        ) : (
          sortedMembers.map(member => (
            <MemberSection
              key={member.id}
              member={member}
              isMe={member.id === myMemberId}
              wk={wk}
              tasks={wow.state.tasks}
              onMoveTask={wow.moveTask}
              onEditMember={() => setModal({ type: 'editMember', member })}
              onDeleteMember={() => openConfirm(
                '담당자 삭제',
                `'${member.name}'님의 모든 업무 데이터가 삭제됩니다. 계속하시겠습니까?`,
                () => wow.deleteMember(member.id)
              )}
              onAddTask={(key) => setModal({ type: 'addTask', key })}
              onEditTask={(key, task) => setModal({ type: 'editTask', key, task })}
              onDeleteTask={(key, taskId) => openConfirm(
                '업무 삭제',
                '이 업무를 삭제하시겠습니까?',
                () => wow.deleteTask(key, taskId)
              )}
              onCycleTaskStatus={wow.cycleStatus}
              onAddCarryover={(key) => setModal({ type: 'addCarryover', key })}
              onEditCarryover={(key, item) => setModal({ type: 'editCarryover', key, item })}
              onDeleteCarryover={(key, itemId) => openConfirm(
                '이월 업무 삭제',
                '이 이월 업무를 삭제하시겠습니까?',
                () => wow.deleteTask(key, itemId)
              )}
            />
          ))
        )}
      </div>

      {(modal?.type === 'addTask' || modal?.type === 'editTask') && (
        <TaskModal
          isEdit={modal.type === 'editTask'}
          task={modal.task}
          onSave={(data) => {
            modal.type === 'editTask'
              ? wow.updateTask(modal.key, modal.task.id, data)
              : wow.addTask(modal.key, data)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === 'addCarryover' || modal?.type === 'editCarryover') && (
        <CarryoverModal
          isEdit={modal.type === 'editCarryover'}
          item={modal.item}
          onSave={(data) => {
            modal.type === 'editCarryover'
              ? wow.updateTask(modal.key, modal.item.id, data)
              : wow.addTask(modal.key, data)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}

      {(modal?.type === 'addMember' || modal?.type === 'editMember') && (
        <MemberModal
          isEdit={modal.type === 'editMember'}
          member={modal.member}
          onSave={(data) => {
            modal.type === 'editMember'
              ? wow.updateMember(modal.member.id, data)
              : wow.addMember(data)
            setModal(null)
          }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'memberManage' && (
        <MemberManageModal
          members={wow.state.members}
          onEdit={(member) => setModal({ type: 'editMember', member })}
          onDelete={(member) => {
            setModal(null)
            openConfirm(
              '담당자 삭제',
              `'${member.name}'님의 모든 업무 데이터가 삭제됩니다. 계속하시겠습니까?`,
              () => wow.deleteMember(member.id)
            )
          }}
          onClose={() => setModal(null)}
        />
      )}

      {confirm && (
        <ConfirmDialog
          title={confirm.title}
          message={confirm.message}
          onConfirm={() => { confirm.onConfirm(); setConfirm(null) }}
          onCancel={() => setConfirm(null)}
        />
      )}

      {modal?.type === 'teamsReport' && (
        <TeamsReportModal
          memberName={displayName}
          todayTasks={getTodayTasks(myMemberId, wow.state.tasks)}
          onClose={() => setModal(null)}
        />
      )}
    </div>
  )
}

export default function App() {
  return (
    <>
      <AuthenticatedTemplate>
        <Board />
      </AuthenticatedTemplate>
      <UnauthenticatedTemplate>
        <LoginPage />
      </UnauthenticatedTemplate>
    </>
  )
}
