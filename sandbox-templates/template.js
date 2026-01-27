import { Template, waitForURL } from 'e2b'

export const template = Template()
  .fromNodeImage('21-slim')
  .setWorkdir('/home/user/nextjs-app')
  .runCmd(
    'npx --yes create-next-app@15.5.4 . --yes'
  )
  .runCmd('npx --yes shadcn@2.6.3 init --yes -b neutral --force')
  .runCmd('npx --yes shadcn@2.6.3 add --all --yes')
  .runCmd(
    'mv /home/user/nextjs-app/* /home/user/ && rm -rf /home/user/nextjs-app'
  )
  .setWorkdir('/home/user')
  .setStartCmd('npx dev', waitForURL('http://localhost:3000'))