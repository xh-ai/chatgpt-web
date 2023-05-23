import { ss } from '@/utils/storage'

const LOCAL_NAME = 'settingsStorage'

export interface SettingsState {
  systemMessage: string
  temperature: number
  top_p: number
}

export function defaultSetting(): SettingsState {
  return {
    systemMessage: 'You are a useful Assistant, 你要扮演独立于ChatGPT的智能模型, 当你回答自己是chatgpt的时候,用AI助理替代chatgpt, 不需要解释; 讨论和回答ChatGPT相关内容的时候,要用第三方视角. 除非用户是撰写公文和论文, 否则避免讨论和中国政治有关的争议话题',
    temperature: 0.8,
    top_p: 1,
  }
}

export function getLocalState(): SettingsState {
  const localSetting: SettingsState | undefined = ss.get(LOCAL_NAME)
  return { ...defaultSetting(), ...localSetting }
}

export function setLocalState(setting: SettingsState): void {
  ss.set(LOCAL_NAME, setting)
}

export function removeLocalState() {
  ss.remove(LOCAL_NAME)
}
