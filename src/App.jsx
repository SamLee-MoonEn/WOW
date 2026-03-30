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
import AppSettingsModal from './components/modals/AppSettingsModal'
import CopyTaskModal from './components/modals/CopyTaskModal'
import WeeklyReportModal from './components/modals/WeeklyReportModal'
import { getTodayTasks } from './utils/teamsUtils'
import { fetchProfilePhoto } from './utils/graphUtils'
import { useWOWState } from './hooks/useWOWState'
import { useAuth } from './auth/useAuth'
import { getWeekKeys } from './utils/weekUtils'
import { uid } from './utils/weekUtils'
import StatusBoard from './components/StatusBoard'
import ExternalSummaryView from './components/ExternalSummaryView'

function Board() {
  const wow = useWOWState()
  const { displayName, email, logout, acquireToken } = useAuth()
  const [modal, setModal] = useState(null)
  const [confirm, setConfirm] = useState(null)
  const [showSummaryView, setShowSummaryView] = useState(false)
  const [myTasksOnly, setMyTasksOnly] = useState(false)

  const wk = getWeekKeys(wow.state.baseWeekOffset)

  // myMemberId를 early return 및 useEffect 의존성 배열보다 앞에 선언 (TDZ 방지)
  const myMember = wow.state.members.find(m => m.email === email || m.name === displayName)
  const myMemberId = myMember?.id

  // 자동 복귀 체크 공통 함수
  const checkAutoReturn = (me) => {
    if (!me) return
    const today = new Date()
    const isWeekday = today.getDay() >= 1 && today.getDay() <= 5

    // 퇴근 → 다음 평일 아침 자동 복귀
    if (me.presence === 'off' && me.offAt) {
      const offDate = new Date(me.offAt)
      if (offDate.toDateString() !== today.toDateString() && isWeekday) {
        wow.updatePresence(me.id, 'working')
        return
      }
    }

    // 휴가 → 종료일 지나면 자동 복귀
    if (me.presence === 'vacation' && me.vacationEnd) {
      const endDate = new Date(me.vacationEnd)
      endDate.setHours(23, 59, 59, 999)
      if (today > endDate) {
        wow.updatePresence(me.id, 'working')
      }
    }
  }

  // 평일 아침 자동 근무중 복귀
  useEffect(() => {
    if (wow.loading || !myMemberId) return
    const me = wow.state.members.find(m => m.id === myMemberId)
    checkAutoReturn(me)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMemberId, wow.loading])

  // 탭이 다시 보일 때도 자동 복귀 체크
  useEffect(() => {
    const handleVisibility = () => {
      if (document.visibilityState !== 'visible') return
      if (wow.loading || !myMemberId) return
      const me = wow.state.members.find(m => m.id === myMemberId)
      checkAutoReturn(me)
    }
    document.addEventListener('visibilitychange', handleVisibility)
    return () => document.removeEventListener('visibilitychange', handleVisibility)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMemberId, wow.loading, wow.state.members])

  // 로그인 시 현재 유저를 멤버 목록에 자동 등록/매칭 (훅은 early return 전에 위치해야 함)
  useEffect(() => {
    if (!displayName || wow.loading || wow.fsError) return
    const exists = wow.state.members.find(
      m => m.email === email || m.name === displayName
    )
    const hasAdmin = wow.state.members.some(m => m.role === 'admin')
    if (!exists) {
      // 첫 멤버이거나 아직 관리자가 없으면 admin, 그 외 신규 로그인은 external로 등록
      const role = (wow.state.members.length === 0 || !hasAdmin) ? 'admin' : 'external'
      wow.addMember({ name: displayName, rank: '팀원', emoji: '👤', email, role })
    } else {
      const updates = {}
      if (exists.email !== email) updates.email = email
      // 마이그레이션: admin이 아무도 없으면 이 유저에게 부여
      if (!hasAdmin) updates.role = 'admin'
      if (Object.keys(updates).length > 0) wow.updateMember(exists.id, { ...exists, ...updates })
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [displayName, email, wow.loading])

  // 로그인 시 Microsoft 프로필 사진 자동 저장
  useEffect(() => {
    if (!myMemberId || wow.loading) return
    const me = wow.state.members.find(m => m.id === myMemberId)
    if (!me) return
    fetchProfilePhoto(acquireToken).then(photoUrl => {
      if (photoUrl && photoUrl !== me.photoUrl) {
        wow.updateMember(myMemberId, { ...me, photoUrl })
      }
    })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [myMemberId, wow.loading])

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

  const isAdmin = myMember?.role === 'admin'
  const isExternal = myMember?.role === 'external'

  // 외부인은 섹션 미표시, 내 섹션이 맨 위로 오도록 정렬
  const visibleMembers = wow.state.members.filter(m => m.role !== 'external')

  // Build board items with group headers
  const myM = myMemberId && !isExternal ? visibleMembers.find(m => m.id === myMemberId) : null
  const otherMembers = visibleMembers.filter(m => m.id !== myMemberId || isExternal)

  const groupMap = {}
  for (const m of otherMembers) {
    const g = m.group || ''
    if (!groupMap[g]) groupMap[g] = []
    groupMap[g].push(m)
  }

  const boardItems = []
  if (myM) boardItems.push({ type: 'member', member: myM })

  const groupKeys = Object.keys(groupMap).sort((a, b) => {
    if (!a && b) return 1
    if (a && !b) return -1
    return a.localeCompare(b, 'ko')
  })

  for (const g of groupKeys) {
    if (g) boardItems.push({ type: 'header', label: g })
    for (const m of groupMap[g]) boardItems.push({ type: 'member', member: m })
  }

  return (
    <div className="min-h-screen bg-jira-bg">
      <Header
        onManageMembers={isAdmin ? () => setModal({ type: 'memberManage' }) : undefined}
        displayName={displayName}
        onLogout={logout}
        onToggleSummary={isAdmin ? () => setShowSummaryView(v => !v) : undefined}
        showSummaryView={showSummaryView}
        onOpenSettings={isAdmin ? () => setModal({ type: 'appSettings' }) : undefined}
      />

      <div className="px-8 py-5">
        <InfoBanner />

{isExternal || showSummaryView ? (
          <ExternalSummaryView members={wow.state.members.filter(m => m.role !== 'external')} />
        ) : (
          <>
            <StatusBoard
              members={wow.state.members.filter(m => m.role !== 'external')}
              myMemberId={myMemberId}
              isAdmin={isAdmin}
              onUpdatePresence={wow.updatePresence}
              onUpdateWorkDesc={wow.updateWorkDesc}
              onEndOfDay={myMemberId ? () => setModal({ type: 'teamsReport' }) : undefined}
            />

            <WeekNav
              wk={wk}
              onPrev={() => wow.shiftWeeks(-1)}
              onNext={() => wow.shiftWeeks(1)}
              onToday={wow.goToCurrentWeek}
              isCurrentWeek={wow.state.baseWeekOffset === 0}
              rightSlot={myMemberId ? (
                <button
                  onClick={() => setMyTasksOnly(v => !v)}
                  className={`flex items-center gap-1.5 text-[12px] px-3 py-1.5 rounded-lg border transition-colors ${
                    myTasksOnly
                      ? 'bg-jira-blue text-white border-jira-blue font-semibold'
                      : 'bg-white border-jira-border text-jira-muted hover:border-jira-blue hover:text-jira-blue'
                  }`}
                >
                  <span>👤</span>
                  <span>내 일감만 보기</span>
                </button>
              ) : null}
            />

            {(() => {
              const displayItems = myTasksOnly
                ? boardItems.filter(item => item.type === 'member' && item.member.id === myMemberId)
                : boardItems
              if (displayItems.length === 0) return (
                <div className="text-center py-16 text-jira-muted">
                  <div className="text-5xl mb-3">👤</div>
                  <div className="text-sm">{myTasksOnly ? '표시할 내 일감이 없습니다' : '담당자를 추가해주세요'}</div>
                </div>
              )
              return displayItems.map((item) =>
                item.type === 'header' ? (
                  <div key={`grp-${item.label}`} className="flex items-center gap-3 mb-2 mt-4 first:mt-0">
                    <span className="text-[12px] font-bold text-jira-muted uppercase tracking-wide">{item.label}</span>
                    <div className="flex-1 h-px bg-jira-border" />
                  </div>
                ) : (
                  <MemberSection
                    key={item.member.id}
                    member={item.member}
                    isMe={item.member.id === myMemberId}
                    isAdmin={isAdmin}
                    showDayGrid
                    wk={wk}
                    tasks={wow.state.tasks}
                    onMoveTask={wow.moveTask}
                    onCopyTask={(fromKey, task) => setModal({ type: 'copyTask', fromKey, task })}
                    onWeeklyReport={(el, member) => setModal({ type: 'weeklyReport', el, member })}
                    onEditMember={() => setModal({ type: 'editMember', member: item.member })}
                    onDeleteMember={() => openConfirm(
                      '담당자 삭제',
                      `'${item.member.name}'님의 모든 업무 데이터가 삭제됩니다. 계속하시겠습니까?`,
                      () => wow.deleteMember(item.member.id)
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
                    onEditCarryover={(key, item2) => setModal({ type: 'editCarryover', key, item: item2 })}
                    onDeleteCarryover={(key, itemId) => openConfirm(
                      '이월 업무 삭제',
                      '이 이월 업무를 삭제하시겠습니까?',
                      () => wow.deleteTask(key, itemId)
                    )}
                  />
                )
              )
            })()}
          </>
        )}
      </div>

      {(modal?.type === 'addTask' || modal?.type === 'editTask') && (
        <TaskModal
          isEdit={modal.type === 'editTask'}
          task={modal.task}
          onSave={(data) => {
            if (modal.type === 'editTask') {
              wow.updateTask(modal.key, modal.task.id, data)
            } else if (data.selectedDays) {
              // 여러 날 + 매주 반복
              const { selectedDays, repeatWeeks = 1, ...taskData } = data
              const memberId = modal.key.split('_')[0]
              for (let w = 0; w < repeatWeeks; w++) {
                const weekInfo = getWeekKeys(wow.state.baseWeekOffset + w)
                selectedDays.forEach(d => wow.addTask(`${memberId}_${weekInfo.current}_${d}`, taskData))
              }
            } else {
              wow.addTask(modal.key, data)
            }
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

      {modal?.type === 'editMember' && (
        <MemberModal
          isEdit
          member={modal.member}
          existingTags={[...new Set(wow.state.members.flatMap(m => m.tags || []))]}
          onSave={(data) => { wow.updateMember(modal.member.id, data); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'memberManage' && (
        <MemberManageModal
          members={wow.state.members}
          myMemberId={myMemberId}
          onEdit={(member) => setModal({ type: 'editMember', member })}
          onDelete={(member) => {
            setModal(null)
            openConfirm(
              '담당자 삭제',
              `'${member.name}'님의 모든 업무 데이터가 삭제됩니다. 계속하시겠습니까?`,
              () => wow.deleteMember(member.id)
            )
          }}
          onChangeRole={(member, role) => wow.updateMember(member.id, { ...member, role })}
          onClose={() => setModal(null)}
          onReorderAll={wow.reorderMembers}
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

      {modal?.type === 'copyTask' && (
        <CopyTaskModal
          task={modal.task}
          fromKey={modal.fromKey}
          members={wow.state.members.filter(m => m.role !== 'external')}
          myMemberId={myMemberId}
          wk={wk}
          onCopy={(toKey) => { wow.copyTask(modal.fromKey, toKey, modal.task.id); setModal(null) }}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'teamsReport' && (
        <TeamsReportModal
          memberName={displayName}
          todayTasks={getTodayTasks(myMemberId, wow.state.tasks)}
          onClose={() => setModal(null)}
          onConfirmEnd={() => { wow.updatePresence(myMemberId, 'off'); setModal(null) }}
          settings={wow.state.settings}
        />
      )}

      {modal?.type === 'appSettings' && (
        <AppSettingsModal
          settings={wow.state.settings ?? {}}
          onSave={(s) => wow.updateSettings(s)}
          onClose={() => setModal(null)}
        />
      )}

      {modal?.type === 'weeklyReport' && (
        <WeeklyReportModal
          targetEl={modal.el}
          weekLabel={`WK${wk.currentWk}`}
          memberName={modal.member?.name ?? displayName}
          acquireToken={acquireToken}
          settings={wow.state.settings}
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
