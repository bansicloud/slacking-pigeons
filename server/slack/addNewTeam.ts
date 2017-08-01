import axios from 'axios'
import { IncomingMessage, ServerResponse} from 'http'
import { json, send} from 'micro'
import { VERIFICATION_TOKEN } from './constants'
import { parseUrlForQuery } from './_parseQuery'
import { CLIENT_ID, CLIENT_SECRET } from './constants'
import { greet } from './greet'
import { createOrUpdateNewTeam } from '../monk'

export async function addNewTeam(req: IncomingMessage, res: ServerResponse) {
  const query = parseUrlForQuery(req.url!)

  if (query.error) {
    res.end(query.error)
    return
  }

  const body = (await axios({
      method: 'post',
      url: `https://slack.com/api/oauth.access?code=${query.code
      }&client_id=${CLIENT_ID
      }&client_secret=${CLIENT_SECRET}`
    }).then((res) => res.data)) as {
    error?: string,
    access_token: string,
    team_id: string,
    incoming_webhook: {
      channel_id: string
    }
  }

  if (body.error) {
    res.end(body.error)
    return
  }

  const team = {
    teamId: body.team_id,
    token: body.access_token,
    channel: body.incoming_webhook.channel_id
  }

  console.log(await createOrUpdateNewTeam(team))
  await greet(team)

  res.end('all good')
  return
}
