import * as React from 'react'
import * as SocketIOClient from 'socket.io-client'
import getSocketId from './storage'
import Input from './Input'
import Message from './Message'

export type TUser = {
  id: string,
  name: string,
  avatar: string
}

export type TMessage = {
  text: string,
  id: string,
  user: TUser,
  sent?: boolean,
  received?: boolean,
  read?: boolean
}
export type TMessages = Array<TMessage>

let tempId = 0

export default (teamId: string) => (Chat: React.ComponentClass<{messages: TMessages, onSendMessage: (msg: string) => void}>) => class HookedChat extends React.Component<{}, {
    messages: TMessages
  }> {
  _socket: SocketIOClient.Socket

  constructor() {
    super()

    this.state = {
      messages: []
    }

    const socketId = getSocketId()

    this._socket = SocketIOClient('http://localhost:4000' + '?socketId=' + socketId + '&teamId=' + teamId)

    this._socket.on('new message', this._onNewMessage)
    this._socket.on('sent message', this._onSentMessage)
    this._socket.on('received message', this._onReceivedMessage)

    fetch('http://localhost:4000/history/' + teamId + '/' + socketId)
    .then(res => res.json())
    .then(messages => {
      this.setState({
        messages: messages.map((m: {user: TUser, text: string, id: string}) => {
          return {
            ...m,
            read: true,
            sent: true,
            received: true
          }
        }).concat(this.state.messages)
      })
    })
  }

  componentWillUnmout() {
    this._socket.close()
  }

  render () {
    return (
      <Chat messages={this.state.messages} onSendMessage={this._onSendMessage} />
    )
  }

  _onNewMessage = (msg: string) => {
    const message = JSON.parse(msg) as {
      text: string,
      id: string,
      user: TUser
    }
    this.setState({
      messages: this.state.messages.concat({
        ...message,
        sent: true,
        received: true,
        read: false
      })
    })
  }

  _onSentMessage = (msg: string) => {
    const message = JSON.parse(msg) as {
      text: string,
    }

    let found = false
    this.setState({
      messages: this.state.messages.map((m) => {
        if (!found && m.text === message.text && m.id.indexOf('temp') === 0) {
          found = true
          return {
            ...m,
            sent: true
          }
        }
        return m
      })
    })
  }

  _onReceivedMessage = (msg: string) => {
    const message = JSON.parse(msg) as {
      text: string,
      id: string,
    }

    let found = false
    this.setState({
      messages: this.state.messages.map((m) => {
        if (!found && m.text === message.text && m.id.indexOf('temp') === 0) {
          found = true
          return {
            ...m,
            sent: true,
            received: true,
            id: message.id
          }
        }
        return m
      })
    })
  }

  _onSendMessage = (message: string) => {
    this.setState({
      messages: this.state.messages.concat({
        text: message,
        user: {
          name: 'me',
          id: 'me',
          avatar: ''
        },
        id: 'temp' + (tempId++),
        read: true
      })
    })
    if (this._socket) {
      this._socket.emit('chat message', message)
    }
  }
}
