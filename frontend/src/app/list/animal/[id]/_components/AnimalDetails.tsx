import React from "react";

interface AnimalDetailsProps {
  announceNumber: string;
  noticeStartDate: string;
  noticeEndDate: string;
  description: string;
  foundLocation: string;
  center: string;
  isCenterSubscriber?: boolean;
  specialNotes?: string;
}

export default function AnimalDetails({
  announceNumber,
  noticeStartDate,
  noticeEndDate,
  description,
  foundLocation,
  center,
  isCenterSubscriber = false,
  specialNotes,
}: AnimalDetailsProps) {
  console.log(noticeStartDate, noticeEndDate);

  return (
    <div className="bg-white rounded-lg mx-4">
      <table className="w-full text-sm">
        <tbody>
          {!isCenterSubscriber && (
            <>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-24">
                  공고번호
                </td>
                <td className="text-sm py-1">
                  <div>{announceNumber ? announceNumber : "-"}</div>
                </td>
              </tr>
              <tr className="h-8">
                <td className="text-gr h5 py-1 pr-3 align-top w-24">
                  공고기간
                </td>
                <td className="text-sm py-1">
                  <div>
                    {noticeStartDate && noticeEndDate
                      ? `${noticeStartDate} ~ ${noticeEndDate}`
                      : "-"}
                  </div>
                </td>
              </tr>
            </>
          )}
          {isCenterSubscriber && (
            <>
              {specialNotes && (
                <tr className="h-8">
                  <td className="text-gr h5 py-1 pr-3 align-top w-24">
                    상세 특이사항
                  </td>
                  <td className="text-sm py-1">
                    <div>{specialNotes}</div>
                  </td>
                </tr>
              )}
            </>
          )}
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-24">특이사항</td>
            <td className="text-sm py-1">
              <div>{description}</div>
            </td>
          </tr>
          <tr className="h-8">
            <td className="text-gr h5 py-1 pr-3 align-top w-24">발견장소</td>
            <td className="text-sm py-1">
              <div>{foundLocation}</div>
            </td>
          </tr>
          {!isCenterSubscriber && (
            <tr className="h-8">
              <td className="text-gr h5 py-1 pr-3 align-top w-24">관할기관</td>
              <td className="text-sm py-1">
                <div>{center}</div>
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}
