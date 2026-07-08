export function buildHtmlTemplate(header: string, body: string, footer: string): string {
  return `<!DOCTYPE html>
<html lang="id">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>D'Jaemo Jamur Krispi</title>
</head>
<body style="margin:0;padding:0;background-color:#f4f4f4;font-family:Arial,sans-serif">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0">
<tr>
<td align="center" style="padding:24px 16px">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="background-color:#ffffff;border-radius:8px;overflow:hidden">

<tr>
<td style="padding:32px 32px 16px;background-color:#1a472a;text-align:center">
<h1 style="margin:0;color:#ffffff;font-size:20px">D'Jaemo Jamur Krispi</h1>
</td>
</tr>

<tr>
<td style="padding:32px">
${header}
${body}
</td>
</tr>

<tr>
<td style="padding:16px 32px;background-color:#f9f9f9;text-align:center;font-size:12px;color:#888888">
${footer}
</td>
</tr>

</table>
</td>
</tr>
</table>
</body>
</html>`;
}
